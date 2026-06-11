import { Db, ObjectId } from "mongodb";
import { MAX_POD_SIZE, MIN_POD_SIZE } from "@/lib/podConstants";

export { MIN_POD_SIZE, MAX_POD_SIZE };

export interface PodMember {
  id: string;
  displayName: string;
  isCurrentUser: boolean;
  activeToday: boolean;
  joinedAt: Date;
}

export interface PodSummary {
  id: string;
  podNumber: number;
  focusArea: string;
  memberCount: number;
  activeCount: number;
  isForming: boolean;
  members: PodMember[];
}

function anonymizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Anonymous";
  const first = trimmed.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export async function getNextPodNumber(db: Db): Promise<number> {
  const counter = await db.collection<{ _id: string; seq: number }>("counters").findOneAndUpdate(
    { _id: "podNumber" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return counter?.seq ?? 1;
}

export async function assignUserToPod(
  db: Db,
  userId: ObjectId,
  focusArea: string
): Promise<ObjectId> {
  const user = await db.collection("users").findOne({ _id: userId });
  if (user?.podId) {
    return new ObjectId(user.podId);
  }

  const area = focusArea || "General";

  const existingPod = await db.collection("pods").findOne(
    {
      focusArea: area,
      $expr: { $lt: [{ $size: { $ifNull: ["$memberIds", []] } }, MAX_POD_SIZE] },
    },
    { sort: { createdAt: 1 } }
  );

  if (existingPod) {
    await db.collection("pods").updateOne(
      { _id: existingPod._id },
      { $addToSet: { memberIds: userId } }
    );
    await db.collection("users").updateOne(
      { _id: userId },
      { $set: { podId: existingPod._id.toString() } }
    );
    return existingPod._id;
  }

  const podNumber = await getNextPodNumber(db);
  const result = await db.collection("pods").insertOne({
    podNumber,
    focusArea: area,
    memberIds: [userId],
    createdAt: new Date(),
  });

  await db.collection("users").updateOne(
    { _id: userId },
    { $set: { podId: result.insertedId.toString() } }
  );

  return result.insertedId;
}

export async function ensureUserPod(
  db: Db,
  userId: ObjectId
): Promise<ObjectId | null> {
  const user = await db.collection("users").findOne({ _id: userId });
  if (!user) return null;

  if (user.podId) {
    return new ObjectId(user.podId);
  }

  if (!user.onboardingComplete) return null;

  const focusArea = user.focusArea || "General";
  return assignUserToPod(db, userId, focusArea);
}

export async function getPodSummary(
  db: Db,
  podId: ObjectId,
  currentUserId: ObjectId
): Promise<PodSummary | null> {
  const pod = await db.collection("pods").findOne({ _id: podId });
  if (!pod) return null;

  const memberIds: ObjectId[] = (pod.memberIds || []).map((id: ObjectId | string) =>
    typeof id === "string" ? new ObjectId(id) : id
  );

  const members = await db
    .collection("users")
    .find({ _id: { $in: memberIds } })
    .project({ name: 1, lastActiveDate: 1, createdAt: 1 })
    .toArray();

  const todayStr = new Date().toISOString().split("T")[0];
  let activeCount = 0;

  const memberList: PodMember[] = members.map((m) => {
    const activeToday = m.lastActiveDate === todayStr;
    if (activeToday) activeCount++;
    return {
      id: m._id.toString(),
      displayName: anonymizeName(m.name || "Anonymous"),
      isCurrentUser: m._id.equals(currentUserId),
      activeToday,
      joinedAt: m.createdAt || new Date(),
    };
  });

  memberList.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

  const memberCount = memberList.length;

  return {
    id: pod._id.toString(),
    podNumber: pod.podNumber || 0,
    focusArea: pod.focusArea || "General",
    memberCount,
    activeCount,
    isForming: memberCount < MIN_POD_SIZE,
    members: memberList,
  };
}

export async function canUserAccessPod(
  db: Db,
  podId: ObjectId,
  userId: ObjectId
): Promise<boolean> {
  const pod = await db.collection("pods").findOne({ _id: podId });
  if (!pod) return false;
  const memberIds: string[] = (pod.memberIds || []).map((id: ObjectId) => id.toString());
  return memberIds.includes(userId.toString());
}
