import { useState } from "react";
import { Button, Text, Profile } from "@stellar/design-system";
import { createPortal } from "react-dom";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { connectWallet, disconnectWallet } from "../util/wallet";

export const WalletButton = ({
  onAction,
  compact = false,
  showBalance = true,
}: {
  onAction?: () => void;
  compact?: boolean;
  showBalance?: boolean;
}) => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const { address, isPending } = useWallet();
  const { xlm, ...balance } = useWalletBalance();
  const buttonLabel = isPending ? "Loading..." : "Connect";

  if (!address) {
    return (
      <Button
        variant="primary"
        size="md"
        onClick={() => {
          onAction?.();
          void connectWallet();
        }}
      >
        {buttonLabel}
      </Button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: compact ? "row" : "column",
        alignItems: compact ? "center" : "flex-start",
        gap: compact ? "8px" : "8px",
        opacity: balance.isLoading ? 0.6 : 1,
      }}
    >
      {showBalance && (
        <Text as="div" size="sm">
          Wallet Balance: {xlm} XLM
        </Text>
      )}

      {showDisconnectModal &&
        createPortal(
          <div
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disconnect-title"
          >
            <div className="confirmation-content">
              <h2 id="disconnect-title" className="confirmation-title">
                Desconectar carteira
              </h2>
              <p className="confirmation-message">
                Conectado como{" "}
                <code style={{ lineBreak: "anywhere" }}>{address}</code>. Deseja
                desconectar?
              </p>
              <div className="confirmation-buttons">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => {
                    void disconnectWallet().then(() =>
                      setShowDisconnectModal(false),
                    );
                  }}
                >
                  Desconectar
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => setShowDisconnectModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <Profile
        publicAddress={address}
        size="md"
        isShort
        onClick={() => {
          onAction?.();
          setShowDisconnectModal(true);
        }}
      />
    </div>
  );
};
