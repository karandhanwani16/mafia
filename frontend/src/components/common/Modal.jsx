const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-backdrop">
      <div className="mafia-card p-6 max-w-md w-full mx-4 animate-modal-content border-mafia-gold/30">
        <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-mafia-border">
          <h2 className="font-display text-xl font-bold text-mafia-gold tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="text-mafia-muted hover:text-mafia-gold text-2xl transition-smooth hover:scale-110 w-8 h-8 flex items-center justify-center rounded"
          >
            ×
          </button>
        </div>
        <div className="text-mafia-cream">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
