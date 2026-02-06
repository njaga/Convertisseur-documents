import { FileType, ConversionFormat } from '../types/converter';
import { supportedFormats } from '../utils/formats';

interface FormatSelectorProps {
  fileType: FileType;
  onFormatSelect: (format: ConversionFormat) => void;
  sourceFormat: string;
}

const FormatSelector = ({ fileType, onFormatSelect, sourceFormat }: FormatSelectorProps) => {
  const availableFormats = supportedFormats[fileType].filter(
    format => format.extension.toLowerCase() !== sourceFormat.toLowerCase()
  );

  return (
    <div className="flex flex-wrap gap-2">
      {availableFormats.map((format) => (
        <button
          key={format.extension}
          onClick={() => onFormatSelect(format)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 
            rounded-lg transition-colors duration-150"
        >
          {format.name}
        </button>
      ))}
    </div>
  );
};

export default FormatSelector;