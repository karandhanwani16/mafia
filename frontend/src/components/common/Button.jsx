import { playSound } from '../../config/sounds';

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-6 py-2.5 rounded-lg font-display font-semibold text-lg tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 hover:scale-[1.02] active:scale-[0.98] shadow-mafia';
  const variants = {
    primary:
      'bg-mafia-gold text-mafia-bg border-mafia-gold hover:bg-mafia-gold-light hover:border-mafia-gold-light hover:shadow-mafia-gold',
    secondary:
      'bg-transparent text-mafia-cream border-mafia-border hover:border-mafia-gold hover:text-mafia-gold',
    danger:
      'bg-mafia-red text-mafia-cream border-mafia-red hover:bg-mafia-red-light hover:border-mafia-red-light',
    success:
      'bg-mafia-success text-mafia-cream border-mafia-success hover:bg-mafia-success-light hover:border-mafia-success-light',
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
