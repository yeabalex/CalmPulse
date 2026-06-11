export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { default: clientPromise } = await import("@/lib/mongodb");
  await clientPromise;
}
