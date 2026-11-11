import { handleApi } from "../../server/api-handler";

export const config = {
  path: "/api/*",
};

export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/\.netlify\/functions\/api/, "").replace(/^\/api/, "");
  return handleApi(path || "/", request);
};
