import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage = 6 
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 m-6">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="p-2 text-blue-800 hover:bg-blue-50 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => onPageChange(index + 1)}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
              currentPage === index + 1
                ? "bg-blue-800 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="p-2 text-blue-800 hover:bg-blue-50 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} />
      </button>
      
      <span className="text-sm text-gray-500 ml-4">
        Page {currentPage} sur {totalPages}
      </span>
    </div>
  );
};

export default Pagination;