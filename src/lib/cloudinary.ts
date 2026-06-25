import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CLOUDINARY_DOMAIN = "res.cloudinary.com";

export async function uploadImageToCloudinary(imageUrl: string): Promise<string> {
  if (!imageUrl) return imageUrl;

  try {
    const url = new URL(imageUrl);
    if (url.hostname === CLOUDINARY_DOMAIN) return imageUrl;
  } catch { return imageUrl; }

  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: "seller-products",
  });

  return result.secure_url;
}
