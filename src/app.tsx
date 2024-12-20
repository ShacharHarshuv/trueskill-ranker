import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { inject } from "@vercel/analytics";

inject();

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Trueskill Ranker</Title>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
