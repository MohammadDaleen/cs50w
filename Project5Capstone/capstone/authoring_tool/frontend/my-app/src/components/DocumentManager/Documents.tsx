import { Input, Text } from "@fluentui/react-components";
import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import { DocumentCard } from "./DocumentCard";
import { Container } from "react-bootstrap";
import { useVM } from "../../viewModel/context";
import { DocumentCreator } from ".";
import { NoData } from "..";
import type { Doc } from "../../types";

/** DocumentList component */
export const Documents = observer(() => {
  const vm = useVM();
  const [query, setQuery] = useState<string>("");

  const filteredDocs = useMemo<Doc[]>(() => {
    return vm.GetFilteredDocuments(query);
  }, [query]);

  return (
    <Container>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, paddingTop: 12 }}>
        <Text weight="semibold">Documents</Text>
        <Input
          placeholder="Search"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        <DocumentCreator />
        {!!filteredDocs && filteredDocs.length > 0 ? (
          filteredDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, paddingTop: 12 }}>
            <NoData message={query ? "No Documents Match" : "No Documents Yet"} addPadding={false} />
          </div>
        )}
      </div>
    </Container>
  );
});
