# Architecture Decision Records

This folder tracks significant technical and product decisions for Cadence — the *why*, not just the *what*. Code shows what was built; these records explain why it was built that way and what alternatives were rejected.

## When to write one

- Choosing a framework, library, or major dependency
- Designing a data model or storage format
- Choosing between competing architectural approaches
- Any decision that would be expensive to reverse

Skip trivial or easily-reversible choices.

## Process

1. Copy [`template.md`](template.md) to `NNNN-short-title.md`, using the next sequential number.
2. Fill it in. Status starts as `Proposed` or `Accepted`.
3. Never delete or rewrite a past ADR to reflect a new decision — write a new one and mark the old one `Superseded by ADR-NNNN`.

See also [`docs/plans/`](../plans/README.md) for feature-scoped design decisions confirmed with Paul during planning.

## Index

| # | Title | Status | Date |
|---|-------|--------|------|
