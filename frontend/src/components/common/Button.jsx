import { playSound } from '../../config/sounds';

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-6 py-2 rounded-lg font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  const handleClick = (e) => {
    if (!disabled) playSound('uiClick');
    onClick?.(e);
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
