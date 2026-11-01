/**
 * Legacy seed entrypoint retained for compatibility.
 *
 * Production-safe seeding is additive only. Never reset or replace products,
 * inventory, images, categories, collections, settings, customer data, orders,
 * coupons, delivery zones or administrator accounts during a deployment.
 *
 * The catalogue bootstrap creates only missing catalogue defaults and leaves
 * every existing database record untouched.
 */
import "./seed-catalogue";
