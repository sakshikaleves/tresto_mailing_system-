import nunjucks from 'nunjucks';

export function renderTemplate(template, context) {
  try {
    return nunjucks.renderString(template, context);
  } catch (e) {
    return 'Template Error';
  }
}
