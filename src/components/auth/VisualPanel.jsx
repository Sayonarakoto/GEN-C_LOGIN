// Light illustration panel: white background + SVG only (no overlays or captions)
const IllustrationPanel = ({ src, alt }) => (
  <div className="login-visual-panel login-visual-panel-light">
    <img src={src} alt={alt || ''} className="illustration" />
  </div>
);

const VisualPanel = ({ visual }) => {
  if (visual.illustration) {
    return <IllustrationPanel src={visual.illustration} alt={visual.alt} />;
  }

  return (
    <div className="login-visual-panel">
      <div className="visual-overlay" />

      <div className="visual-content">
        <div className="caption-strip">
          <span className="caption-kicker">{visual.kicker}</span>
          <h2>{visual.title}</h2>
          <p>{visual.description}</p>
        </div>

        {visual.icons && <div className="animated-icons">{visual.icons}</div>}
      </div>
    </div>
  );
};

export default VisualPanel;
