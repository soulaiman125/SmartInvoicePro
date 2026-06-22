// Product image with a graceful fallback placeholder.
const SIZES = {
  sm: 'h-12 w-12 text-base',
  md: 'h-full w-full text-3xl',
  lg: 'h-full w-full text-5xl',
};

export default function ProductThumb({ src, name = '', size = 'md', rounded = 'rounded-lg' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${SIZES[size]} ${rounded} object-cover`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100 font-semibold text-brand-400 ${SIZES[size]} ${rounded}`}
    >
      {name.trim().charAt(0).toUpperCase() || '📦'}
    </div>
  );
}
