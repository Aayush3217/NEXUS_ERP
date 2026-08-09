import React from 'react';
import { Loader2 } from 'lucide-react';

// ----------------------------------------------------
// BUTTON COMPONENT
// ----------------------------------------------------
export const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  type = 'button',
  className = '',
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm border border-transparent',
    secondary: 'bg-surface hover:bg-bg text-textPrimary border border-border shadow-sm',
    danger: 'bg-danger-500 hover:bg-danger-500/90 text-white shadow-sm border border-transparent',
    success: 'bg-success-500 hover:bg-success-500/90 text-white shadow-sm border border-transparent',
    ghost: 'hover:bg-bg text-textSecondary hover:text-textPrimary border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-5 py-2.5 text-base h-12',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
});

// ----------------------------------------------------
// INPUT FIELD COMPONENT
// ----------------------------------------------------
export const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">{label}</label>}
      <input
        ref={ref}
        type={type}
        className={`w-full px-3 py-2 text-sm bg-surface text-textPrimary placeholder-textSecondary/50 border rounded-lg shadow-xs transition-all focus:outline-none focus:ring-1 ${
          error 
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
            : 'border-border focus:border-primary-500 focus:ring-primary-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger-500 font-medium">{error}</p>}
    </div>
  );
});

// ----------------------------------------------------
// TEXTAREA COMPONENT
// ----------------------------------------------------
export const Textarea = React.forwardRef(({
  label,
  error,
  rows = 3,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">{label}</label>}
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full px-3 py-2 text-sm bg-surface text-textPrimary placeholder-textSecondary/50 border rounded-lg shadow-xs transition-all focus:outline-none focus:ring-1 ${
          error 
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
            : 'border-border focus:border-primary-500 focus:ring-primary-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger-500 font-medium">{error}</p>}
    </div>
  );
});

// ----------------------------------------------------
// SELECT DROP-DOWN COMPONENT
// ----------------------------------------------------
export const Select = React.forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Select option',
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">{label}</label>}
      <select
        ref={ref}
        className={`w-full px-3 py-2 text-sm bg-surface text-textPrimary border rounded-lg shadow-xs transition-all focus:outline-none focus:ring-1 ${
          error 
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
            : 'border-border focus:border-primary-500 focus:ring-primary-500'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children || options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger-500 font-medium">{error}</p>}
    </div>
  );
});

// ----------------------------------------------------
// BADGE COMPONENT
// ----------------------------------------------------
export const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    success: 'bg-success-50 text-success-500 dark:bg-success-500/10 border-success-500/20',
    danger: 'bg-danger-50 text-danger-500 dark:bg-danger-500/10 border-danger-500/20',
    warning: 'bg-warning-50 text-warning-500 dark:bg-warning-500/10 border-warning-500/20',
    info: 'bg-info-50 text-info-500 dark:bg-info-500/10 border-info-500/20',
    neutral: 'bg-bg text-textSecondary border-border',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border tracking-wide uppercase ${variants[variant] || variants.info} ${className}`}>
      {children}
    </span>
  );
};

// ----------------------------------------------------
// CARD COMPONENT
// ----------------------------------------------------
export const Card = ({ children, className = '', title, headerActions, animated = true }) => {
  return (
    <div className={`bg-surface border border-border rounded-lg overflow-hidden shadow-xs ${
      animated ? 'animate-slide-up' : ''
    } ${className}`}>
      {(title || headerActions) && (
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          {title && <h3 className="font-semibold text-textPrimary text-sm tracking-tight">{title}</h3>}
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

// ----------------------------------------------------
// STAT CARD COMPONENT
// ----------------------------------------------------
export const StatCard = ({ title, value, icon: Icon, description, trend, variant = 'primary', animated = true }) => {
  const iconVariants = {
    primary: 'bg-primary-50 text-primary-500',
    success: 'bg-success-50 text-success-500',
    warning: 'bg-warning-50 text-warning-500',
    danger: 'bg-danger-50 text-danger-500',
  };

  return (
    <div className={`bg-surface border border-border p-5 rounded-lg shadow-xs flex items-center justify-between transition-all duration-150 ${
      animated ? 'animate-slide-up' : ''
    }`}>
      <div>
        <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-xl font-bold text-textPrimary tracking-tight">{value}</h4>
        {(description || trend) && (
          <p className="text-xs text-textSecondary mt-1.5 flex items-center gap-1.5">
            {trend && <span className="font-semibold text-success-500">{trend}</span>}
            {description}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-lg ${iconVariants[variant] || iconVariants.primary}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// SKELETON LOADER COMPONENT
// ----------------------------------------------------
export const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <div className="w-full flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-border/40 rounded-md ${className || 'h-8 w-full'}`}
        />
      ))}
    </div>
  );
};

// ----------------------------------------------------
// EMPTY STATE COMPONENT
// ----------------------------------------------------
export const EmptyState = ({ title = 'No results found', description = 'Try adjusting your search filters.', icon: Icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-border bg-surface">
      {Icon ? (
        <div className="p-3 rounded-full bg-bg text-textSecondary mb-3">
          <Icon className="w-6 h-6" />
        </div>
      ) : null}
      <h3 className="font-semibold text-textPrimary text-sm mb-1">{title}</h3>
      <p className="text-xs text-textSecondary max-w-sm mb-5 leading-normal">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

// ----------------------------------------------------
// PAGE HEADER COMPONENT
// ----------------------------------------------------
export const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-border">
      <div>
        <h1 className="text-xl font-bold text-textPrimary tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-textSecondary mt-0.5 leading-normal">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};
