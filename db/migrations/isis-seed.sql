-- GENERADO por scripts/gen-isis-seed.mjs — carga inicial del sync ISIS→Postgres (mock).
BEGIN;

INSERT INTO clientes (isis_id,nombre,cuit,rubro,provincia,localidad,telefono,email,vendedor_asignado) VALUES
('C001','Bulonera Central SRL','30-71234567-8','Bulonera','Buenos Aires','La Matanza','11-4555-1234','ventas@buloneracentral.com.ar','Carlos'),
('C002','Ferretería El Tornillo','30-69876543-2','Ferretería','CABA','Palermo','11-4777-8899','info@eltornillo.com.ar','Diego'),
('C003','Distribuidora Norte SA','30-55666777-1','Distribuidor/Mayorista','Córdoba','Córdoba Capital','351-555-1212','compras@distrinorte.com.ar','Carlos'),
('C004','Casa de Repuestos La Plata','20-33444555-6','Casa de repuestos','Buenos Aires','La Plata','221-444-3322','repuestoslaplata@gmail.com','Diego'),
('C005','Taller Mecánico Rodríguez','20-11222333-9','Taller mecánico','Buenos Aires','San Justo','11-6666-7788','tallermrodriguez@hotmail.com','Carlos'),
('C006','Bulonera Santiago','30-88777666-4','Bulonera','Buenos Aires','Pehuajó','2396-428984','bulonerasantiago@gmail.com','Carlos'),
('C007','Ferretería Los Andes','30-55444333-1','Ferretería','Mendoza','Mendoza Capital','261-555-7788','info@losandes.com.ar','Diego'),
('C008','Repuestos Seguí','20-44333222-8','Casa de repuestos','Santa Fe','Rosario','341-327-3761','seguirepuestos@gmail.com','Diego'),
('C009','Gomería Aluminé','20-33222111-5','Gomería','Neuquén','Aluminé','2942-577700','gomeriaalumine@hotmail.com.ar','Diego'),
('C010','Metalúrgica M&A','30-77666555-3','Industria','Santa Fe','Las Parejas','3471-672241','met_mya@hotmail.com','Carlos'),
('C011','Neumáticos La Rotonda SRL','30-66555444-7','Casa de repuestos','Neuquén','Plaza Huincul','299-588-0189','l_cairone@hotmail.com','Carlos'),
('C012','Amotor Lázaro','20-99888777-1','Bulonera','Buenos Aires','Provincia Bs As','2241-540831','cocconiamotor@gmail.com','Carlos')
ON CONFLICT (isis_id) DO UPDATE SET nombre=EXCLUDED.nombre,cuit=EXCLUDED.cuit,rubro=EXCLUDED.rubro,provincia=EXCLUDED.provincia,localidad=EXCLUDED.localidad,telefono=EXCLUDED.telefono,email=EXCLUDED.email,vendedor_asignado=EXCLUDED.vendedor_asignado;

INSERT INTO articulos (codigo,categoria,subcategoria,tipo,descripcion,unidad_medida) VALUES
('BUL-RDA-001','Bulón','Bulón de rueda','Liviano','Bulón rueda 12x1.50 liviano zinc','unidad'),
('BUL-RDA-002','Bulón','Bulón de rueda','Pesado','Bulón rueda 14x1.50 pesado cincado','unidad'),
('BUL-MAS-001','Bulón','Bulón de masa','Standard','Bulón masa 10x1.25 standard','unidad'),
('BUL-MAS-002','Bulón','Bulón de masa','Reforzado','Bulón masa 12x1.50 reforzado','unidad'),
('ESP-COM-001','Espárrago','Espárrago competición','Doble cono','Espárrago competición 10x1.25 doble cono','unidad'),
('ESP-COM-002','Espárrago','Espárrago competición','Tuerca alta','Espárrago competición 12x1.50 con tuerca alta','unidad'),
('ESP-IND-001','Espárrago','Espárrago industrial','Hexagonal','Espárrago industrial 16x2.00 hexagonal grado 8','kg'),
('ESP-IND-002','Espárrago','Espárrago industrial','Cuadrado','Espárrago industrial 20x2.50 cuadrado','kg'),
('TUE-RDA-001','Tuerca','Tuerca rueda','Standard','Tuerca rueda 12x1.50 cincada','unidad'),
('TUE-RDA-002','Tuerca','Tuerca rueda','Seguridad','Tuerca rueda 14x1.50 con seguridad','unidad'),
('TUE-ESP-001','Tuerca','Tuerca especial','Doble cono','Tuerca doble cono 10x1.25 competición','unidad'),
('BUL-AGR-001','Bulón','Bulón agricola','Standard','Bulón agricola 5/8x3 zincado','unidad'),
('BUL-AGR-002','Bulón','Bulón agricola','Reforzado','Bulón agricola 3/4x4 reforzado grado 5','unidad'),
('ESP-UTE-001','Espárrago','Espárrago UTE','Standard','Espárrago UTE 16x2.00 galvanizado','kg'),
('KIT-SEG-001','Kit','Kit seguridad','Complete','Kit seguridad bulonería (12 medidas)','kit')
ON CONFLICT (codigo) DO UPDATE SET categoria=EXCLUDED.categoria,subcategoria=EXCLUDED.subcategoria,tipo=EXCLUDED.tipo,descripcion=EXCLUDED.descripcion,unidad_medida=EXCLUDED.unidad_medida;

TRUNCATE stock RESTART IDENTITY;
INSERT INTO stock (articulo_codigo,kilos_disponibles,unidades_disponibles,estado,ubicacion) VALUES
('BUL-RDA-001',0,2500,'Disponible','Estante A-12'),
('BUL-RDA-002',0,1800,'Disponible','Estante A-14'),
('BUL-MAS-001',0,3200,'Disponible','Estante B-03'),
('BUL-MAS-002',0,950,'Bajo stock','Estante B-05'),
('ESP-COM-001',0,600,'Bajo stock','Estante C-01'),
('ESP-COM-002',0,1200,'Disponible','Estante C-02'),
('ESP-IND-001',850.5,0,'Disponible','Depósito mayorista'),
('ESP-IND-002',420,0,'Disponible','Depósito mayorista'),
('TUE-RDA-001',0,5000,'Disponible','Estante D-01'),
('TUE-RDA-002',0,3400,'Disponible','Estante D-02'),
('TUE-ESP-001',0,800,'Bajo stock','Estante C-05'),
('BUL-AGR-001',0,1500,'Disponible','Estante E-01'),
('BUL-AGR-002',0,2200,'Disponible','Estante E-03'),
('ESP-UTE-001',320,0,'Disponible','Depósito mayorista'),
('KIT-SEG-001',0,200,'Bajo stock','Estante K-01');

INSERT INTO pedidos (nro_pedido,cliente_isis_id,cliente_nombre,fecha_pedido,kilos_total,estado,retira_local,nro_factura,ruta_pdf) VALUES
('PED-1045','C005','Taller Mecánico Rodríguez','2026-06-02',45,'En proceso',TRUE,NULL,NULL),
('PED-1044','C003','Distribuidora Norte SA','2026-06-01',1200,'En proceso',FALSE,NULL,NULL),
('PED-1043','C002','Ferretería El Tornillo','2026-05-31',320,'Terminado',FALSE,NULL,NULL),
('PED-1042','C001','Bulonera Central SRL','2026-05-30',850.5,'Facturado',FALSE,'F-004521','\\servidor-isis\facturas\F-004521.pdf'),
('PED-1046','C004','Casa de Repuestos La Plata','2026-05-29',560,'Facturado',FALSE,'F-004522','\\servidor-isis\facturas\F-004522.pdf')
ON CONFLICT (nro_pedido) DO UPDATE SET cliente_isis_id=EXCLUDED.cliente_isis_id,cliente_nombre=EXCLUDED.cliente_nombre,fecha_pedido=EXCLUDED.fecha_pedido,kilos_total=EXCLUDED.kilos_total,estado=EXCLUDED.estado,retira_local=EXCLUDED.retira_local,nro_factura=EXCLUDED.nro_factura,ruta_pdf=EXCLUDED.ruta_pdf;

-- NOTA: prioridad_armado y notas NO están en el UPDATE → no se pisan (los escribe Martín en NocoDB).

INSERT INTO ventas_mensuales (cliente_isis_id,periodo,total_facturado,kilos_vendidos,ticket_promedio) VALUES
('C001','2026-01',1300576,530,45000),
('C002','2026-01',827765,247,28000),
('C003','2026-01',2376036,1116,72000),
('C007','2026-01',1040643,362,35000),
('C012','2026-01',1562389,762,52000),
('C001','2026-02',1301675,559,45000),
('C002','2026-02',763545,288,28000),
('C003','2026-02',2512366,1082,72000),
('C007','2026-02',991635,425,35000),
('C012','2026-02',1774797,736,52000),
('C001','2026-03',1310403,506,45000),
('C002','2026-03',782536,274,28000),
('C003','2026-03',2576985,1055,72000),
('C007','2026-03',1042431,351,35000),
('C012','2026-03',1700216,725,52000),
('C001','2026-04',1490242,567,45000),
('C002','2026-04',790636,270,28000),
('C003','2026-04',2341247,1097,72000),
('C007','2026-04',891104,358,35000),
('C012','2026-04',1870087,687,52000),
('C001','2026-05',1533199,492,45000),
('C002','2026-05',798903,274,28000),
('C003','2026-05',2435750,1098,72000),
('C007','2026-05',1071190,375,35000),
('C012','2026-05',1588706,705,52000),
('C001','2026-06',1475155,555,45000),
('C002','2026-06',717722,287,28000),
('C003','2026-06',2249628,1009,72000),
('C007','2026-06',1031493,402,35000),
('C012','2026-06',1818471,765,52000)
ON CONFLICT (cliente_isis_id,periodo) DO UPDATE SET total_facturado=EXCLUDED.total_facturado,kilos_vendidos=EXCLUDED.kilos_vendidos,ticket_promedio=EXCLUDED.ticket_promedio;

COMMIT;
