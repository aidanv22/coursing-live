function Content({ searchParams }) {
  const status = searchParams.status;
  const channel = searchParams.channel;

  if (status === 'invalid') {
    return (
      <>
        <h1>Something went wrong</h1>
        <p className="sub">
          That unsubscribe link isn't valid. If you're trying to stop receiving messages, reply
          STOP to any text, or contact the business directly.
        </p>
      </>
    );
  }

  return (
    <>
      <h1>You're unsubscribed</h1>
      <p className="sub">
        You won't receive any more {channel === 'sms' ? 'text messages' : 'emails'} from this
        sender. If you opted in to other channels too, those aren't affected — you can unsubscribe
        from each separately.
      </p>
    </>
  );
}

export default function UnsubscribedPage({ searchParams }) {
  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <Content searchParams={searchParams} />
      </div>
    </div>
  );
}
