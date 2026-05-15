export function GET() {
  return Response.json({ buildId: process.env.BUILD_ID ?? 'dev' });
}
