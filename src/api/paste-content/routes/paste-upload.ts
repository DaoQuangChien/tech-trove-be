export default {
  routes: [
    {
      method: 'POST',
      path: '/paste-content/process',
      handler: 'paste-upload.processHtml',
      config: {
        auth: false, // admin JWT verified manually in the controller
        description: 'Process pasted HTML: download external images and re-host them in Strapi',
        tags: ['Paste Content'],
      },
    },
  ],
};
