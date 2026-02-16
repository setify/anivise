interface OrgInvitationEmailProps {
  recipientName?: string
  inviterName: string
  organizationName: string
  role: string
  inviteLink: string
  expiryDays: number
  locale: 'de' | 'en'
}

const texts = {
  de: {
    greeting: (name?: string) => (name ? `Hallo ${name},` : 'Hallo,'),
    body: (inviter: string, org: string) =>
      `${inviter} hat Sie eingeladen, die Organisation "${org}" auf Anivise zu verwalten.`,
    role: 'Ihre Rolle:',
    button: 'Einladung annehmen',
    expiry: (days: number) => `Dieser Link ist ${days} Tage gueltig.`,
    footer:
      'Diese E-Mail wurde von der Anivise-Plattform gesendet. Falls Sie diese Einladung nicht erwartet haben, koennen Sie sie ignorieren.',
  },
  en: {
    greeting: (name?: string) => (name ? `Hello ${name},` : 'Hello,'),
    body: (inviter: string, org: string) =>
      `${inviter} has invited you to manage the organization "${org}" on Anivise.`,
    role: 'Your role:',
    button: 'Accept Invitation',
    expiry: (days: number) => `This link is valid for ${days} days.`,
    footer:
      'This email was sent by the Anivise platform. If you did not expect this invitation, you can safely ignore it.',
  },
}

export function OrgInvitationEmail({
  recipientName,
  inviterName,
  organizationName,
  role,
  inviteLink,
  expiryDays,
  locale,
}: OrgInvitationEmailProps) {
  const t = texts[locale]

  return (
    <div
      style={{
        fontFamily: 'Manrope, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b4b' }}>
          Anivise
        </h1>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '16px', color: '#374151', marginBottom: '16px' }}>
          {t.greeting(recipientName)}
        </p>
        <p style={{ fontSize: '16px', color: '#374151', marginBottom: '16px' }}>
          {t.body(inviterName, organizationName)}
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          {t.role} <strong>{role}</strong>
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={inviteLink}
          style={{
            display: 'inline-block',
            backgroundColor: '#4338ca',
            color: '#ffffff',
            padding: '12px 32px',
            borderRadius: '9999px',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          {t.button}
        </a>
      </div>

      <p
        style={{
          fontSize: '13px',
          color: '#9ca3af',
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        {t.expiry(expiryDays)}
      </p>

      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '24px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{t.footer}</p>
      </div>
    </div>
  )
}
