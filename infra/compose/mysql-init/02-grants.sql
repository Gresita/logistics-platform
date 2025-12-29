CREATE USER IF NOT EXISTS 'shipments_user'@'%' IDENTIFIED BY 'shipments_pass';
GRANT ALL PRIVILEGES ON shipments.* TO 'shipments_user'@'%';

CREATE USER IF NOT EXISTS 'tracking_user'@'%' IDENTIFIED BY 'tracking_pass';
GRANT ALL PRIVILEGES ON tracking.* TO 'tracking_user'@'%';

CREATE USER IF NOT EXISTS 'orders_user'@'%' IDENTIFIED BY 'orders_pass';
GRANT ALL PRIVILEGES ON orders.* TO 'orders_user'@'%';

CREATE USER IF NOT EXISTS 'inventory_user'@'%' IDENTIFIED BY 'inventory_pass';
GRANT ALL PRIVILEGES ON inventory.* TO 'inventory_user'@'%';

CREATE USER IF NOT EXISTS 'billing_user'@'%' IDENTIFIED BY 'billing_pass';
GRANT ALL PRIVILEGES ON billing.* TO 'billing_user'@'%';

FLUSH PRIVILEGES;