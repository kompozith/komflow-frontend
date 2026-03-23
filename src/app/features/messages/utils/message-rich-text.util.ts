const VARIABLE_REGEX = /\{\{[^{}]+\}\}/g;

const VARIABLE_ALIASES: Record<string, string> = {
  // Contact legacy camelCase -> contact_* snake_case
  '{{firstname}}': '{{contact_first_name}}',
  '{{lastname}}': '{{contact_last_name}}',
  '{{email}}': '{{contact_email}}',
  '{{language}}': '{{contact_language}}',
  '{{country}}': '{{contact_country}}',
  '{{city}}': '{{contact_city}}',
  '{{username}}': '{{contact_username}}',
  '{{phonenumber}}': '{{contact_phone_number}}',
  '{{whatsappnumber}}': '{{contact_whatsapp_number}}',

  // Event legacy camelCase -> event_* snake_case
  '{{eventlocaltime}}': '{{event_local_time}}',
  '{{eventendlocaltime}}': '{{event_end_local_time}}',
  '{{eventtitle}}': '{{event_title}}',
  '{{eventstartdate}}': '{{event_start_date}}',
  '{{eventstarttime}}': '{{event_start_time}}',
  '{{eventenddate}}': '{{event_end_date}}',
  '{{eventendtime}}': '{{event_end_time}}',
  '{{eventlocation}}': '{{event_location}}',
  '{{eventtimezone}}': '{{event_timezone}}',
  '{{eventsubtitle}}': '{{event_subtitle}}',
  '{{eventaddress}}': '{{event_address}}',
  '{{eventmeetingurl}}': '{{event_meeting_url}}',
  '{{eventpublicurl}}': '{{event_public_url}}',
};

export function normalizeVariableKey(key: string): string {
  const trimmed = (key || '').trim();
  if (!trimmed) return '';
  const wrapped = trimmed.startsWith('{{') && trimmed.endsWith('}}')
    ? trimmed
    : `{{${trimmed}}}`;
  const compact = wrapped.replace(/\s+/g, '');
  return VARIABLE_ALIASES[compact.toLowerCase()] ?? compact;
}

export function stripHtmlToText(content: string): string {
  if (!content) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export function excerptFromHtml(content: string, maxLength = 80): string {
  const text = stripHtmlToText(content);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}...`;
}

export function renderTemplatePreviewHtml(
  content: string,
  resolveVariable: (token: string) => string,
  highlightClass = 'variable-highlight'
): string {
  if (!content) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const textNodes: Text[] = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const text = textNode.nodeValue || '';
    VARIABLE_REGEX.lastIndex = 0;
    if (!VARIABLE_REGEX.test(text)) {
      return;
    }

    const fragment = doc.createDocumentFragment();
    let lastIndex = 0;
    VARIABLE_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null = VARIABLE_REGEX.exec(text);

    while (match) {
      const token = match[0];
      const index = match.index;

      if (index > lastIndex) {
        fragment.appendChild(doc.createTextNode(text.slice(lastIndex, index)));
      }

      const span = doc.createElement('span');
      span.className = highlightClass;
      span.setAttribute('title', normalizeVariableKey(token));
      span.textContent = resolveVariable(normalizeVariableKey(token));
      fragment.appendChild(span);

      lastIndex = index + token.length;
      match = VARIABLE_REGEX.exec(text);
    }

    if (lastIndex < text.length) {
      fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
    }

    textNode.replaceWith(fragment);
  });

  return doc.body.innerHTML;
}
