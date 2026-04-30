import { Button } from "@/components/ui/button";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  title?: string;
  message: string;
}

export function FeedbackModal({ isOpen, onClose, type, title, message }: FeedbackModalProps) {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-300 max-w-xs w-full mx-4 text-center">
        
        <div className="mb-6">
          {isSuccess ? (
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          ) : (
            <svg className="crossmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="crossmark__circle" cx="26" cy="26" r="25" fill="none" />
              <path className="cross__path" fill="none" d="M16,16 l20,20" />
              <path className="cross__path" fill="none" d="M16,36 l20,-20" />
            </svg>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {title || (isSuccess ? "Berhasil!" : "Gagal")}
        </h3>
        <p className="text-sm text-slate-500 mb-8">{message}</p>
        
        <Button 
          onClick={onClose} 
          className={`w-full rounded-xl h-11 font-semibold shadow-lg transition-all ${
            isSuccess 
              ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 text-white" 
              : "bg-red-500 hover:bg-red-600 shadow-red-500/30 text-white"
          }`}
        >
          {isSuccess ? "Selesai" : "Tutup"}
        </Button>
      </div>
      <style>{`
        /* Success Animation */
        .checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 3;
          stroke-miterlimit: 10;
          stroke: #10b981;
          fill: none;
          animation: stroke 0.4s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: block;
          stroke-width: 4;
          stroke: #10b981;
          stroke-miterlimit: 10;
          box-shadow: inset 0px 0px 0px #10b981;
          animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }
        .checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
        }

        /* Error Animation */
        .crossmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 3;
          stroke-miterlimit: 10;
          stroke: #ef4444;
          fill: none;
          animation: stroke 0.4s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .crossmark {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: block;
          stroke-width: 4;
          stroke: #ef4444;
          stroke-miterlimit: 10;
          box-shadow: inset 0px 0px 0px #ef4444;
          animation: fillred .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }
        .cross__path {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          transform-origin: 50% 50%;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
        }

        /* Common Keyframes */
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.1, 1.1, 1);
          }
        }
        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 40px #d1fae5;
          }
        }
        @keyframes fillred {
          100% {
            box-shadow: inset 0px 0px 0px 40px #fee2e2;
          }
        }
      `}</style>
    </div>
  );
}
