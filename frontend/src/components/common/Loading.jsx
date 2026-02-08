const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-blue-500 mb-4"></div>
      <p className="text-gray-400 animate-pulse-slow">{message}</p>
    </div>
  );
};

export default Loading;
