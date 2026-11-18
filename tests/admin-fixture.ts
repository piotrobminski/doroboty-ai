import {
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_ADMIN_ID,
  primaryAdminProfile,
  removeLegacyOperatorRoles,
} from "../server/admin-bootstrap";
import { initialState } from "../src/features/prototype/model";

export { PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_ID };
export const FIXTURE_TEMPORARY_PASSWORD = "Fixture-Temporary-24";
export const FIXTURE_ADMIN_PASSWORD = "Fixture-Administrator-24";
export function serverInitialState() {
  const state = initialState();
  removeLegacyOperatorRoles(state);
  state.people.push(primaryAdminProfile());
  return state;
}
