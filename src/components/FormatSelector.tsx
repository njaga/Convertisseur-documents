import { ConversionFormat, FileType } from '../types/converter';
import { getAvailableOutputFormats } from '../utils/formats';

interface FormatSelectorProps {
  fileType: FileType;
  onFormatSelect: (format: ConversionFormat) => void;
  sourceFormat: string;
}

const FormatSelector = ({ onFormatSelect, sourceFormat }: FormatSelectorProps) => {
  const availableFormats = getAvailableOutputFormats(sourceFormat);

  if (availableFormats.length === 0) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        Aucune conversion fiable n'est disponible pour ce format pour le moment.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableFormats.map((format) => (
        <button
          key={format.extension}
          type="button"
          onClick={() => onFormatSelect(format)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-150"
        >
          {format.name}
        </button>
      ))}
    </div>
  );
};

export default FormatSelector;
