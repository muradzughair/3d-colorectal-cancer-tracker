// Top bar: tool name, demo mode tag and the decision-support notice.
export default function Header() {
  return (
    <header className="header">
      <div className="header-title">
        <h1>Colorectal Cancer Decision Support</h1>
        <span className="demo-tag">Demo mode</span>
      </div>
      <p className="header-notice">Decision-support tool. The doctor makes the final decision.</p>
    </header>
  )
}
