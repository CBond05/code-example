const { seedLockWrapper } = require("../app/shared/utils/seed/seeds-utils");
const path = require("path");

exports.seed = knex =>
  seedLockWrapper(knex, path.basename(__filename), async function (knex) {
  const creationInfo = {
    created_at: new Date(),
    created_by: "system",
  };

  await knex("role")
    .insert(["admin", "employee"].map(rName => ({ name: rName, ...creationInfo })));
});
