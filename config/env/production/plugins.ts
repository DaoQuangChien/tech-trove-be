export default ({ env }) => ({
  upload: {
    config: {
      provider: "@strapi/provider-upload-aws-s3",
      providerOptions: {
        baseUrl: env("R2_PUBLIC_URL"),
        rootPath: env("R2_ROOT_PATH", ""),
        s3Options: {
          credentials: {
            accessKeyId: env("R2_ACCESS_KEY_ID"),
            secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
          },
          endpoint: env("R2_ENDPOINT"),
          region: "auto",
          forcePathStyle: true,
          params: {
            Bucket: env("R2_BUCKET"),
          },
        },
      },
      actionOptions: {
        upload: {
          CacheControl: "public, max-age=31536000, immutable",
        },
        uploadStream: {
          CacheControl: "public, max-age=31536000, immutable",
        },
        delete: {},
      },
    },
  },
});
