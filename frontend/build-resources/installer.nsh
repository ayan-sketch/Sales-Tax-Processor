; Custom NSIS installer script for Tax Compliance Management System
; This file is included in the NSIS installer build

!macro customInstall
  ; Create additional shortcuts or registry entries here if needed
  ; WriteRegStr HKCU "Software\TaxCompliance" "" "InstallPath" "$INSTDIR"
!macroend

!macro customUnInstall
  ; Clean up additional registry entries on uninstall
  ; DeleteRegKey HKCU "Software\TaxCompliance"
!macroend