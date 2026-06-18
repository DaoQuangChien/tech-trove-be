export default ({ env }) => ({
  "tiptap-editor": {
    enabled: true,
    config: {
      presets: {
        default: {
          heading: true,
          bold: true,
          italic: true,
          underline: true,
          strike: true,
          bulletList: true,
          orderedList: true,
          blockquote: true,
          codeBlock: true,
          textAlign: true,
          link: true,
          table: true,
          mediaLibrary: true,
          textColor: true,
          highlightColor: true,
          superscript: true,
          subscript: true,
          horizontalRule: true,
          history: true,
        },
        minimal: {
          bold: true,
          italic: true,
          underline: true,
          bulletList: true,
          orderedList: true,
          history: true,
        },
      },
    },
  },
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
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
