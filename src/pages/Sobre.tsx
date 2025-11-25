import React from "react";
import { Layout, Text } from "@stellar/design-system";

const Sobre: React.FC = () => {
  return (
    <Layout.Content>
      <Layout.Inset>
        <div className="card" style={{ marginTop: 12 }}>
          <Text as="h1" size="xl">
            Sobre
          </Text>
          <Text as="p" size="md" style={{ marginTop: 12 }}>
            © {new Date().getFullYear()} PresenceTrack. Licensed under the{" "}
            <a
              href="http://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apache License, Version 2.0
            </a>
            .
          </Text>
        </div>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Sobre;
