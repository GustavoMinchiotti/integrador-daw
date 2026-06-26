# Funcionamiento de la Búsqueda Avanzada

---

# 1. Introducción

La búsqueda avanzada del módulo **Proyectos** permite al usuario encontrar rápidamente los proyectos que necesita aplicando distintos criterios simultáneamente.

A diferencia de una búsqueda simple, esta implementación permite combinar:

* búsqueda por nombre
* filtro por estado
* ordenamiento
* paginación
* obtención de estadísticas (resumen)

Todo esto se realiza mediante una única petición HTTP al servidor.

---

# 2. Arquitectura general

La búsqueda atraviesa todas las capas de la aplicación.

```
Usuario
    │
    ▼
Angular (Componente)
    │
    ▼
API Client
    │
HTTP GET
    │
    ▼
NestJS Controller
    │
    ▼
ProyectosService
    │
    ▼
TypeORM QueryBuilder
    │
    ▼
PostgreSQL
    │
    ▼
Respuesta JSON
    │
    ▼
Angular actualiza la tabla
```

Cada capa tiene una responsabilidad distinta.

---

# 3. Responsabilidad de cada archivo

## Frontend

### proyectos-listado.ts

Es el componente que controla toda la pantalla.

Se encarga de:

* guardar el texto buscado
* guardar el estado seleccionado
* controlar la página actual
* controlar el ordenamiento
* solicitar los datos
* actualizar la tabla

No realiza consultas a la base de datos.

Simplemente administra la interfaz.

---

### proyectos-listado-api-client.ts

Su única responsabilidad es comunicarse con el backend.

Construye la petición HTTP:

```ts
GET /api/v1/proyectos
```

y agrega los parámetros necesarios.

---

## Backend

### proyectos.controller.ts

Su responsabilidad es recibir la petición HTTP.

Ejemplo:

```
GET /api/v1/proyectos
```

Extrae los parámetros enviados desde Angular y llama al servicio.

No contiene lógica de negocio.

---

### proyectos.service.ts

Aquí ocurre prácticamente toda la búsqueda.

Es quien:

* interpreta los filtros
* construye la consulta SQL
* consulta la base de datos
* arma la respuesta

---

# 4. Inicio de la búsqueda

Todo comienza cuando el usuario escribe.

Por ejemplo:

```
web
```

o selecciona:

```
Estado = ACTIVO
```

El componente guarda esos valores en Signals.

```ts
searchQuery

estadoFiltro

sortBy

sortDirection
```

Estas variables representan el estado actual de la búsqueda.

---

# 5. El método buscarOFiltrar()

Cuando cambia un filtro se ejecuta:

```ts
buscarOFiltrar()
```

Este método no consulta inmediatamente.

Primero hace:

```ts
clearTimeout(...)
```

Luego crea un nuevo temporizador.

```ts
setTimeout(...,300)
```

---

## ¿Qué logra esto?

Implementa un **debounce**.

Ejemplo:

El usuario escribe

```
P
Pr
Pro
Proy
Proye
Proyecto
```

Sin debounce se realizarían:

```
6 consultas HTTP
```

Con debounce solamente se hace:

```
1 consulta
```

300 ms después de que el usuario deja de escribir.

Esto mejora mucho el rendimiento.

---

# 6. refrescarProyectos()

Una vez terminado el debounce se ejecuta:

```ts
refrescarProyectos()
```

Este método:

1. muestra el indicador de carga

```ts
loading = true
```

1. llama al API Client

```ts
buscarProyectos(...)
```

pasándole todos los filtros actuales.

---

# 7. Construcción de la petición HTTP

El API Client crea un objeto:

```ts
HttpParams
```

Agrega siempre:

```
page

limit

sortBy

sortDirection
```

Y solamente agrega:

```
search
```

si el usuario escribió algo.

Lo mismo ocurre con:

```
estado
```

---

## Ejemplo

Si el usuario escribió

```
web
```

y seleccionó

```
ACTIVO
```

la URL queda aproximadamente:

```
GET /api/v1/proyectos

?page=1
&limit=5
&search=web
&estado=ACTIVO
&sortBy=nombre
&sortDirection=ASC
```

---

# 8. El Controller

El controlador recibe esa petición.

Extrae los parámetros.

Luego llama:

```ts
obtenerProyectos(params)
```

A partir de aquí comienza el trabajo del backend.

---

# 9. Preparación de la consulta

Dentro del servicio primero calcula:

```ts
page

limit
```

Después decide:

```
qué columna ordenar

en qué dirección
```

Por ejemplo

```
nombre

ASC
```

---

# 10. Creación del QueryBuilder

La búsqueda utiliza:

```ts
createQueryBuilder()
```

No utiliza:

```ts
repository.find()
```

¿Por qué?

Porque QueryBuilder permite agregar condiciones dinámicamente.

Primero crea la consulta base.

```ts
const query =
repository
.createQueryBuilder("proyecto")
.leftJoinAndSelect(...)
```

En este momento todavía no existe ningún filtro.

---

# 11. Búsqueda por nombre

Si existe texto:

```ts
params.search
```

se agrega:

```ts
andWhere(...)
```

La condición es:

```sql
LOWER(proyecto.nombre)
LIKE
LOWER(:search)
```

El parámetro enviado es:

```
%texto%
```

Por ejemplo

```
web
```

produce

```sql
LIKE '%web%'
```

Esto encuentra:

```
Mi Web

Portal Web

Sistema Web

Aplicación Web
```

---

## ¿Por qué LOWER?

Para ignorar mayúsculas.

Entonces

```
WEB

Web

web

wEb
```

encuentran exactamente los mismos resultados.

---

# 12. Filtro por estado

Si el usuario seleccionó un estado:

```ts
ACTIVO
```

se agrega otro

```ts
AND
```

La consulta pasa a ser:

```sql
WHERE
nombre LIKE '%web%'

AND estado='ACTIVO'
```

Ahora solamente devuelve proyectos activos cuyo nombre contiene "web".

---

# 13. Resumen estadístico

Antes de traer los datos, el servicio hace algo muy interesante.

Duplica la consulta:

```ts
query.clone()
```

¿Por qué?

Porque necesita calcular estadísticas sin modificar la consulta principal.

Obtiene:

```
Cantidad de activos

Cantidad de finalizados

Cantidad de bajas

Cantidad de proyectos internos
```

Todo respetando exactamente los mismos filtros.

---

# 14. Ordenamiento

Después agrega:

```ts
orderBy(...)
```

Dependiendo de la selección del usuario.

Ejemplos:

```sql
ORDER BY nombre ASC
```

o

```sql
ORDER BY estado DESC
```

---

# 15. Paginación

Después agrega:

```ts
skip()

take()
```

Equivalente SQL:

```
OFFSET

LIMIT
```

Ejemplo:

Página

```
3
```

con

```
5 registros
```

produce

```sql
OFFSET 10

LIMIT 5
```

La base de datos solamente devuelve esos cinco registros.

---

# 16. Ejecución

Finalmente:

```ts
getManyAndCount()
```

Hace dos cosas al mismo tiempo.

Obtiene

```
los proyectos
```

y

```
la cantidad total
```

Esto permite construir correctamente la paginación.

---

# 17. Construcción de la respuesta

Después el servicio crea un DTO.

La respuesta queda aproximadamente así:

```json
{
  "data":[...],
  "total":32,
  "page":2,
  "limit":5,
  "lastPage":7,
  "resumen":{
      "activos":15,
      "finalizados":10,
      "bajas":5,
      "internos":2
  }
}
```

El frontend ya tiene toda la información necesaria.

---

# 18. Actualización del componente

Cuando Angular recibe la respuesta:

actualiza:

```ts
proyectos

totalItems

totalPages

proyectosActivos

proyectosFinalizados

proyectosBaja

proyectosInternos
```

Como utiliza **Signals**, Angular vuelve a renderizar automáticamente la pantalla.

No hace falta actualizar la tabla manualmente.

---

# 19. SQL aproximado generado

Si el usuario busca:

```
web
```

Estado:

```
ACTIVO
```

Orden:

```
nombre ASC
```

Página

```
2
```

La consulta sería similar a:

```sql
SELECT
    proyecto.*,
    cliente.*
FROM proyecto
LEFT JOIN cliente
ON proyecto.cliente_id = cliente.id

WHERE
LOWER(proyecto.nombre)
LIKE LOWER('%web%')

AND proyecto.estado='ACTIVO'

ORDER BY proyecto.nombre ASC

LIMIT 5
OFFSET 5;
```

El QueryBuilder genera automáticamente una consulta muy parecida.

---

# 20. Flujo completo

```
Usuario escribe

        │

        ▼

buscarOFiltrar()

        │

Debounce

300 ms

        │

        ▼

refrescarProyectos()

        │

        ▼

API Client

        │

HTTP GET

        │

        ▼

Controller

        │

        ▼

ProyectosService

        │

        ▼

createQueryBuilder()

        │

Agrega WHERE

Agrega filtros

Agrega ORDER BY

Agrega LIMIT

Agrega OFFSET

        │

        ▼

PostgreSQL

        │

Devuelve resultados

        │

        ▼

DTO

        │

        ▼

Angular

        │

Signals

        │

        ▼

Tabla actualizada
```

---

# 21. ¿Por qué esta implementación es buena?

## Separación de responsabilidades

Cada clase tiene una única responsabilidad:

* **Componente:** interfaz y estado.
* **API Client:** comunicación HTTP.
* **Controller:** recepción de solicitudes.
* **Service:** lógica de negocio.
* **TypeORM:** acceso a la base de datos.

Esto sigue el principio de **Responsabilidad Única (SRP)** de SOLID.

## Uso de QueryBuilder

Permite construir consultas dinámicas según los filtros que el usuario aplique, evitando escribir múltiples consultas SQL distintas.

## Debounce

Reduce la cantidad de solicitudes al servidor mientras el usuario escribe, mejorando el rendimiento y la experiencia de uso.

## DTO (Data Transfer Object)

La información enviada entre frontend y backend está estructurada y controlada, evitando exponer directamente las entidades de la base de datos.

## Paginación

Solo se recuperan los registros necesarios para la página actual, reduciendo el consumo de memoria y el tiempo de respuesta.

---

# 22. Conceptos de la materia que aparecen

Este único caso práctico reúne muchos de los contenidos vistos en **Desarrollo de Aplicaciones Web**:

* Arquitectura **MVC**.
* **Angular** como framework SPA.
* Comunicación mediante **HTTP GET**.
* Uso de **NestJS**.
* **Controladores**.
* **Servicios**.
* **DTO** de entrada y salida.
* **TypeORM**.
* Patrón **Repository**.
* **QueryBuilder**.
* **Persistencia** en base de datos relacional.
* **ORM (Object-Relational Mapping)**.
* Paginación.
* Ordenamiento.
* Filtros dinámicos.
* Debounce para optimizar solicitudes.
* Uso de **Signals** para actualización reactiva de la interfaz.

---

# 23. Resumen

La búsqueda avanzada comienza cuando el usuario modifica un filtro o escribe un texto. El componente Angular espera 300 ms mediante un **debounce** y luego llama al **API Client**, que construye una petición **HTTP GET** con los parámetros de búsqueda. El **Controller** recibe la solicitud y delega el trabajo al **ProyectosService**. Allí, **TypeORM QueryBuilder** arma dinámicamente la consulta SQL agregando los filtros, el ordenamiento y la paginación según los parámetros recibidos. La base de datos devuelve los proyectos encontrados y el servicio construye un **DTO** con los datos y un resumen estadístico. Finalmente, Angular actualiza automáticamente la interfaz gracias al uso de **Signals**, mostrando la nueva lista de proyectos sin necesidad de recargar la página.
