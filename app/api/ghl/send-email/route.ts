import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

// Client → GHL location mapping
const CLIENT_LOCATIONS: Record<string, { locationId: string; pitKey: string }> = {
  'clubsheis': { locationId: 'AkhI3DXZ01YFKLGXfg2V', pitKey: 'pit-572b13e1-ccf9-4ea5-8746-01545c7a704a' },
  'club-she-is': { locationId: 'AkhI3DXZ01YFKLGXfg2V', pitKey: 'pit-572b13e1-ccf9-4ea5-8746-01545c7a704a' },
  'wisdom-wellness': { locationId: 'OgSu08WcrumYq4ZHcoHp', pitKey: 'pit-422da6d8-dfb5-4c92-a414-275f708cd4ee' },
  'link-interiors': { locationId: '9FSp4QLrs63jpzugi2NL', pitKey: 'pit-7a3af52d-0072-481d-b7e9-beb45a64ae55' },
  'awahome': { locationId: 'GWAnJQeAJSENicSyGKDC', pitKey: 'pit-2a6fa1c8-b07e-468a-b71c-066d4dda4b05' },
  'palesa-dooms': { locationId: 'NDVeEcaieSYrPqxiBRxD', pitKey: 'pit-0d6af12a-d7ec-4d52-ad06-aab2c7f861ac' },
  'purpose-for-impact': { locationId: 'P2GxuKbjPEU0kQlXrCqf', pitKey: 'pit-f47204f7-4e8d-4d87-8d21-789a09446bdb' },
  'sibulele-sibaca': { locationId: 'P2GxuKbjPEU0kQlXrCqf', pitKey: 'pit-f47204f7-4e8d-4d87-8d21-789a09446bdb' },
};

function findGhlCredentials(clientId: string, clientName: string) {
  // Try direct match on clientId
  if (CLIENT_LOCATIONS[clientId]) return CLIENT_LOCATIONS[clientId];

  // Try matching on lowercased name
  const slug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
  for (const [key, value] of Object.entries(CLIENT_LOCATIONS)) {
    if (slug.includes(key) || key.includes(slug)) return value;
  }

  return null;
}

function contentToHtml(content: string, clientName: string): string {
  // Convert the plain text newsletter to styled HTML
  const paragraphs = content.split('\n\n').filter(Boolean);

  const htmlParts = paragraphs.map((p) => {
    const trimmed = p.trim();

    // Detect headers (lines in ALL CAPS or ending with :)
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 80 && !trimmed.includes('.')) {
      return `<h2 style="font-family: 'Georgia', serif; font-size: 22px; color: #2D2D2D; margin: 28px 0 12px 0; font-weight: bold;">${trimmed}</h2>`;
    }

    // Detect section labels (SUBJECT LINE:, CTA:, etc.)
    if (/^[A-Z][A-Z\s]+:/.test(trimmed)) {
      const [label, ...rest] = trimmed.split(':');
      const value = rest.join(':').trim();
      if (value) {
        return `<p style="font-family: 'Georgia', serif; font-size: 16px; line-height: 1.7; color: #2D2D2D; margin: 0 0 16px 0;"><strong>${label}:</strong> ${value}</p>`;
      }
      return `<h3 style="font-family: 'Georgia', serif; font-size: 14px; color: #9A9A9A; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 8px 0;">${label}</h3>`;
    }

    // Regular paragraph
    return `<p style="font-family: 'Georgia', serif; font-size: 16px; line-height: 1.7; color: #2D2D2D; margin: 0 0 16px 0;">${trimmed.replace(/\n/g, '<br>')}</p>`;
  });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <tr><td style="padding: 32px 40px 24px 40px; border-bottom: 2px solid #F0EBE3;">
          <p style="font-family: 'Georgia', serif; font-size: 12px; color: #7B4B2A; text-transform: uppercase; letter-spacing: 2px; margin: 0;">${clientName}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding: 32px 40px 40px 40px;">
          ${htmlParts.join('\n          ')}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding: 24px 40px; border-top: 1px solid #F0EBE3; background-color: #FAF7F2;">
          <p style="font-family: 'Georgia', serif; font-size: 12px; color: #9A9A9A; margin: 0; text-align: center;">
            Sent via ${clientName} Content Studio
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function generateId() {
  // Generate Unlayer-compatible IDs
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

function makeRow(contents: Record<string, unknown>[]): Record<string, unknown> {
  return {
    id: generateId(),
    cells: [1],
    columns: [
      {
        id: generateId(),
        contents,
        values: {
          _meta: { htmlID: generateId(), htmlClassNames: '' },
        },
      },
    ],
    values: {
      displayCondition: null,
      columns: false,
      backgroundColor: '',
      columnsBackgroundColor: '#FFFFFF',
      backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'custom', position: 'center' },
      padding: '0px',
      anchor: '',
      hideDesktop: false,
      _meta: { htmlID: generateId(), htmlClassNames: '' },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true,
    },
  };
}

function makeTextContent(html: string, padding = '10px 40px'): Record<string, unknown> {
  return {
    id: generateId(),
    type: 'text',
    values: {
      containerPadding: padding,
      anchor: '',
      textAlign: 'left',
      lineHeight: '160%',
      linkStyle: { inherit: true, linkColor: '#7B4B2A', linkHoverColor: '#7B4B2A', linkUnderline: true, linkHoverUnderline: true },
      hideDesktop: false,
      displayCondition: null,
      _meta: { htmlID: generateId(), htmlClassNames: '' },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true,
      text: html,
    },
  };
}

function contentToDndBlocks(content: string, clientName: string): Record<string, unknown> {
  const paragraphs = content.split('\n\n').filter(Boolean);
  const rows: Record<string, unknown>[] = [];

  // Header row — brand name
  rows.push(makeRow([
    makeTextContent(
      `<p style="font-size:12px;color:#7B4B2A;text-transform:uppercase;letter-spacing:2px;font-family:Georgia,serif;">${clientName}</p>`,
      '24px 40px 16px 40px'
    ),
  ]));

  // Content rows — each paragraph becomes a text block in its own row
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;

    const isHeader = trimmed === trimmed.toUpperCase() && trimmed.length < 80 && !trimmed.includes('.');
    const isSectionLabel = /^[A-Z][A-Z\s]+:/.test(trimmed);

    let htmlText: string;
    if (isHeader) {
      htmlText = `<h2 style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#2D2D2D;margin:0;">${trimmed}</h2>`;
    } else if (isSectionLabel) {
      const [label, ...rest] = trimmed.split(':');
      const value = rest.join(':').trim();
      if (value) {
        htmlText = `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.7;color:#2D2D2D;margin:0;"><strong>${label}:</strong> ${value}</p>`;
      } else {
        htmlText = `<p style="font-family:Georgia,serif;font-size:14px;color:#9A9A9A;text-transform:uppercase;letter-spacing:1px;margin:0;">${label}</p>`;
      }
    } else {
      htmlText = `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.7;color:#2D2D2D;margin:0;">${trimmed.replace(/\n/g, '<br>')}</p>`;
    }

    rows.push(makeRow([makeTextContent(htmlText, '4px 40px')]));
  }

  // Footer row
  rows.push(makeRow([
    makeTextContent(
      `<p style="font-family:Georgia,serif;font-size:12px;color:#9A9A9A;text-align:center;margin:0;">Sent via ${clientName} Content Studio</p>`,
      '20px 40px'
    ),
  ]));

  // Unlayer-compatible design JSON
  return {
    counters: { u_row: rows.length, u_column: rows.length, u_content_text: rows.length + 2 },
    body: {
      id: generateId(),
      rows,
      values: {
        popupPosition: 'center',
        popupWidth: '600px',
        popupHeight: 'auto',
        borderRadius: '10px',
        contentAlign: 'center',
        contentVerticalAlign: 'center',
        contentWidth: '600px',
        fontFamily: { label: 'Georgia', value: 'Georgia,serif' },
        textColor: '#2D2D2D',
        popupBackgroundColor: '#FFFFFF',
        popupBackgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'cover', position: 'center' },
        popupOverlay_backgroundColor: 'rgba(0, 0, 0, 0.1)',
        popupCloseButton_position: 'top-right',
        popupCloseButton_backgroundColor: '#DDDDDD',
        popupCloseButton_iconColor: '#000000',
        popupCloseButton_borderRadius: '0px',
        popupCloseButton_margin: '0px',
        popupCloseButton_action: { name: 'close_popup', attrs: { onClick: "document.querySelector('.u-teleporter').remove();" } },
        backgroundColor: '#FAF7F2',
        backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'custom', position: 'center' },
        preheaderText: '',
        linkStyle: { body: true, linkColor: '#7B4B2A', linkHoverColor: '#7B4B2A', linkUnderline: true, linkHoverUnderline: true },
        _meta: { htmlID: generateId(), htmlClassNames: '' },
      },
    },
    schemaVersion: 2,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientName, content, subjectLine, fromName, templateName: customName, editorType = 'code' } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Find GHL credentials for this client
    const creds = findGhlCredentials(clientId || '', clientName || '');

    if (!creds) {
      return NextResponse.json({
        error: `No GHL account found for ${clientName}. Available: Club She Is, Wisdom & Wellness, Link Interiors, Awahome, Palesa Dooms, Purpose for Impact.`,
      }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${creds.pitKey}`,
      'Version': GHL_VERSION,
      'Content-Type': 'application/json',
    };

    // Step 1: Create email template
    const templateName = customName || `${clientName} Newsletter - ${new Date().toLocaleDateString('en-ZA')}`;
    const isBuilder = editorType === 'builder';

    const createRes = await fetch(`${GHL_BASE}/emails/builder`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        locationId: creds.locationId,
        type: isBuilder ? 'builder' : 'html',
        name: templateName,
        title: templateName,
        builderVersion: '2',
        isPlainText: false,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('GHL create template error:', err);
      return NextResponse.json({
        error: 'Failed to create email template in Ghutte. Check that the PIT key has emails/builder.write scope.',
      }, { status: 500 });
    }

    const createData = await createRes.json();
    const templateId = createData.redirect || createData.id || createData.templateId;

    if (!templateId) {
      return NextResponse.json({ error: 'Ghutte returned no template ID' }, { status: 500 });
    }

    // Step 2: Set content — builder DnD format or raw HTML
    const html = contentToHtml(content, clientName);

    let dataBody: Record<string, unknown>;

    if (isBuilder) {
      // Send Unlayer-compatible DnD JSON for visual builder
      const dnd = contentToDndBlocks(content, clientName);
      dataBody = {
        locationId: creds.locationId,
        templateId,
        updatedBy: 'content-studio',
        editorType: 'builder',
        html,
        design: dnd,
        dnd: JSON.stringify(dnd),
        previewText: subjectLine || '',
        isPlainText: false,
      };
    } else {
      dataBody = {
        locationId: creds.locationId,
        templateId,
        updatedBy: 'content-studio',
        editorType: 'html',
        html,
        previewText: subjectLine || '',
        isPlainText: false,
      };
    }

    const dataRes = await fetch(`${GHL_BASE}/emails/builder/data`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dataBody),
    });

    let previewUrl: string | undefined;
    let dataDebug: string | undefined;
    if (!dataRes.ok) {
      const err = await dataRes.text();
      console.error('GHL set content error:', dataRes.status, err);
      dataDebug = `Content upload failed (${dataRes.status}): ${err.substring(0, 200)}`;
    } else {
      const dataResult = await dataRes.json();
      previewUrl = dataResult.previewUrl;
      console.log('GHL set content success:', JSON.stringify(dataResult).substring(0, 300));
    }

    // Step 3: Set subject and from details
    if (subjectLine || fromName) {
      await fetch(`${GHL_BASE}/emails/builder/${templateId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          ...(subjectLine ? { subject: subjectLine } : {}),
          ...(fromName ? { fromName } : {}),
        }),
      });
    }

    // GHL dashboard URL — templates list (direct template links aren't supported by GHL's SPA routing)
    const ghlUrl = `https://app.gohighlevel.com/v2/location/${creds.locationId}/marketing/emails?tab=templates`;
    const ghlTemplatesUrl = ghlUrl;

    return NextResponse.json({
      success: true,
      templateId,
      templateName,
      ghlUrl,
      ghlTemplatesUrl,
      previewUrl,
      dataDebug,
      editorType: isBuilder ? 'builder' : 'code',
      message: `Template "${templateName}" created in Ghutte as ${isBuilder ? 'Visual Builder' : 'Code Editor'}. Open to review and send.`,
    });
  } catch (error) {
    console.error('GHL send error:', error);
    return NextResponse.json({ error: 'Failed to send to GHL' }, { status: 500 });
  }
}
