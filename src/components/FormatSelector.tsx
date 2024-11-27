import { FileType, ConversionFormat } from '../types/converter';
import { supportedFormats } from '../utils/formats';

interface FormatSelectorProps {
  fileType: FileType;
  onFormatSelect: (format: ConversionFormat) => void;
  sourceFormat: string;
}

const FormatSelector = ({ fileType, onFormatSelect, sourceFormat }: FormatSelectorProps) => {
  const formats = supportedFormats;

  const availableFormats = formats[fileType].filter(
    format => format.extension.toLowerCase() !== sourceFormat.toLowerCase()
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {availableFormats.map((format) => (
        <button
          key={format.extension}
          onClick={() => onFormatSelect(format)}
          className="flex items-center justify-center p-4 rounded-xl border-2 border-blue-500/20 
          bg-white hover:bg-blue-50 hover:border-blue-500 transition-all duration-200
          text-gray-900 font-medium shadow-sm hover:shadow-md"
        >
          <span className="text-base whitespace-nowrap">{format.name}</span>
        </button>
      ))}
    </div>
  );
};

export default FormatSelector;