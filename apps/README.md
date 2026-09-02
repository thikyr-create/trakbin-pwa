# Apps Directory

This directory contains the Expo mobile applications for Trakbin.

## Structure

- `caretaker/` - Customer-facing mobile app (to be moved from `mobile/`)
- `driver/` - Driver/field worker mobile app (to be built)

## Monorepo Configuration

Both apps share dependencies via the `packages/` directory using npm workspaces.

## Next Steps

1. Move `mobile/` to `apps/caretaker/`
2. Create `apps/driver/` scaffold
3. Extract shared code to `packages/`
