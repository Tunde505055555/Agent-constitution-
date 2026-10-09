# Agent Constitution — Project Submission

## One-line description
Agent Constitution is a GenLayer-powered governance dApp that lets users define rules for AI agents, evaluate proposed actions, and audit on-chain decisions.

## What it does, who it is for, and why it is useful

Agent Constitution provides an inspectable governance framework for autonomous AI agents. Users register an agent with a mission, wallet, and written constitution, then evaluate proposed actions against those rules through a live GenLayer Intelligent Contract.

A dry run returns a verdict before an action is recorded. Submitted adjudications create an on-chain history with the governing rule, severity, confidence, and explanation. Owners can amend constitutions with a documented reason, appeal rulings with new evidence, and freeze or unfreeze agents with review notes. An Intelligence Suite offers Trust Passport assessments of the selected agent, Behavioral Drift analysis, Constitution Health checks, and hypothetical stress testing.

The project serves AI-agent developers, automation owners, DAO and treasury teams, governance reviewers, and researchers exploring accountable autonomous systems. It helps them understand why an action was allowed, questioned, or found to violate its rules, and inspect that decision later.

Its usefulness comes from combining rule authoring, external action evaluation, auditable records, appeals, and emergency controls in one interface. Reviewers do not have to rely solely on an agent's own claim that it followed instructions.

The application uses MetaMask, connects only to GenLayer Studio Dev, and reads live data from 0x6270f106b3B7CCa85D305b7Afcdb98Be294dc207. It never supplies fake agents or transaction history; empty state prompts real registration.

This is a development-stage governance tool, not a legal opinion or guaranteed safety mechanism. It evaluates and records proposed actions; it does not itself execute trades, transfer the entered GEN amount, or force an external bot to obey a verdict. Enforcement requires integration with that bot's execution workflow.

## Expected verification outcome (500-character limit)

After connecting MetaMask on Studio Dev, a newly registered agent appears in the live registry. A dry run returns a verdict without adding history. Submitting an action creates a matching Action ID in Audit Log with its verdict, rule, severity, confidence, and explanation. Refreshing retains the on-chain record. The fixed address remains 0x6270f106b3B7CCa85D305b7Afcdb98Be294dc207, with no other network choices or demo data.

## Exactly what the visitor should do

### 1. Open and connect

1. Open the website in a browser with MetaMask installed and unlocked. On mobile, use the MetaMask in-app browser if the ordinary browser does not expose the wallet.
2. Open **GenLayer Studio Dev** in the top bar.
3. Confirm chain ID `61997` and the fixed contract address above.
4. Click **Connect MetaMask** and approve account access.
5. When a write is requested, approve adding or switching to Studio Dev if prompted. Use a development wallet, not production funds.

Reading the registry does not require a wallet. The app attempts a Studio test-funds top-up before writes if the balance is below its threshold; the faucet is best-effort and may be unavailable.

### 2. Register an actual agent

1. On the registry, click **Register agent**.
2. Enter a unique Agent ID, a name, a meaningful mission, and your agent's real wallet address.
3. Choose a constitution template or add rules manually. Review the preamble, article names, rule IDs, text, severity, and parameters.
4. For a minimal evaluator walkthrough, create a rule stating that an agent may submit status reports without sending funds. This is a proposed user-authored rule, not pre-existing data.
5. Click **Register & ratify**, approve the MetaMask transaction, and wait for confirmation.
6. Confirm the new agent appears in the registry. Open its dossier and check the mission and rules.

### 3. Dry-run and record an action

1. Open **Adjudicate** and select your registered agent.
2. Enter a unique Action ID, kind, description, GEN amount, counterparty if relevant, and evidence links or notes if available.
3. For the reporting rule above, submit a truthful proposal to produce a status report, with `0` GEN and no transfer. Do not invent evidence.
4. Use the dry-run control and inspect the verdict, governing rule, severity, confidence, and explanation. A dry run does not commit action history.
5. Submit the action for recorded adjudication and approve the MetaMask transaction.
6. Wait for consensus, then open **Audit Log** and locate the same Action ID.
7. Open its details and confirm the returned verdict. Refresh the page and verify the record remains visible.

The outcome is determined by the contract; a successful verification is a real returned verdict plus a persistent matching action record, not a promise of a specific approval.

### 4. Optional governance and diagnostics

- In **Constitution**, inspect versions and amend rules only if necessary, with an owner reason and explicit confirmation.
- In **Governance**, use the owner wallet to file an appeal with a statement and new evidence, or freeze/unfreeze an agent with review notes.
- In **Intelligence**, select the agent and run Trust Passport, Behavioral Drift, Constitution Health, or your own stress scenarios.
- Owner actions and diagnostics may take additional consensus time. Do not repeatedly submit while a request is pending.


## Verification status

- The fixed-address and Studio-Dev configuration tests passed after the latest address change.
- A browser check confirmed that previously saved Bradbury settings do not change the Studio Dev connection and that the new contract's registry reads successfully with an authentic empty state.
- An earlier complete contract-flow test used a **separate test copy**, not the current user-supplied address.
- MetaMask approval was not exercised in the headless test browser.
- Full registration, adjudication, and governance on the current address still require the real-wallet walkthrough above. Neither this README nor the expected outcome is proof those steps have already succeeded there.


## Contract source note
The included Python reference is retained corrected source from earlier deployment work, not a verified export of the contract at the latest address.
