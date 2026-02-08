const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-backdrop">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 animate-modal-content shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-smooth hover:scale-110"
          >
            ×
          </button>
        </div>
        <div className="text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
