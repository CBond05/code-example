exports.up = function (knex) {
  return knex.schema.createTable('role', (table) => {

    table.increments();
    table.string('name').notNullable();
    table.string('description');

    table.timestamp('created_at')
      .notNullable()
      .defaultTo(knex.fn.now());
    table.string('created_by')
      .notNullable();

    table.timestamp('updated_at')
    table.string('updated_by');

    table.boolean("is_active")
      .notNullable()
      .defaultTo(true);
  })
};

exports.down = function (knex) {
  return knex.schema
    .dropTable("role")
};
