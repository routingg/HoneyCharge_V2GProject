"use client";

import { X } from "lucide-react";
import {
  NAVIGATION_PROVIDERS,
  openNavigationApp,
  type NavigationDestination,
} from "@/lib/services/navigation/openNavigationApp";

/** §17–§18: provider picker bottom sheet, calls the openNavigationApp() abstraction. */
export function NavigationAppSheet({
  destination,
  onClose,
}: {
  destination: NavigationDestination;
  onClose: () => void;
}) {
  return (
    <div className="a2-navsheet-backdrop" onClick={onClose}>
      <div className="a2-navsheet" onClick={(event) => event.stopPropagation()}>
        <div className="a2-navsheet-header">
          <strong>길찾기 앱 선택</strong>
          <button type="button" onClick={onClose} aria-label="닫기">
            <X size={16} />
          </button>
        </div>
        <ul className="a2-navsheet-list">
          {NAVIGATION_PROVIDERS.map((provider) => (
            <li key={provider.id}>
              <button
                type="button"
                onClick={() => {
                  openNavigationApp({ provider: provider.id, destination });
                  onClose();
                }}
              >
                {provider.label}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="a2-navsheet-cancel" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
}
