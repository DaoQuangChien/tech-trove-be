export default {
  /**
   * Process pasted HTML: download external images server-side, upload to
   * Strapi's Media Library, and return the rewritten HTML + URL map.
   *
   * Also handles a single clipboard image sent as a base64 data URL.
   *
   * Body: { html?: string; clipboardImage?: string; mimeType?: string }
   */
  async processHtml(ctx: any) {
    const authHeader: string | undefined = ctx.request.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return ctx.unauthorized('Authentication required');
    }

    const { html, clipboardImage, mimeType } = ctx.request.body ?? {};

    if (clipboardImage && mimeType) {
      try {
        const uploadedUrl = await strapi
          .service('api::paste-content.paste-upload')
          .processClipboardImage(strapi, clipboardImage, mimeType);

        return ctx.send({ uploadedUrl });
      } catch (err) {
        strapi.log.error('[PasteContent] Clipboard upload failed', err);
        return ctx.internalServerError('Failed to upload clipboard image');
      }
    }

    if (!html || typeof html !== 'string') {
      return ctx.badRequest('Missing "html" string in request body');
    }

    try {
      const result = await strapi
        .service('api::paste-content.paste-upload')
        .processHtml(strapi, html);

      ctx.send(result);
    } catch (err) {
      strapi.log.error('[PasteContent] HTML processing failed', err);
      ctx.internalServerError('Failed to process pasted content');
    }
  },
};
