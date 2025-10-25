import { Request, Response } from 'express';
import { dbConnection } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { sendResetEmail } from '../services/mailer';

function generarPasswordRandom(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
// Selects de datos
export const login = async (req: Request, res: Response) => {
  const { DPI, Password } = req.body as { DPI: string; Password: string };

  if (!DPI || !Password) {
    return res.status(400).json({ message: 'Faltan credenciales (DPI o contraseña)' });
  }

  try {
    const [results] = await dbConnection
      .query<RowDataPacket[]>('SELECT * FROM Usuario WHERE DPI = ? AND Password = ? AND StatusUsuario="Activo"', [DPI, Password]);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const user = results[0];

    if (user.StatusUsuario !== 'Activo') {
      // Usuario inactivo → redirigir a otra página
      return res.status(403).json({ message: 'Usuario no activo', redirect: '/usuario-inactivo' });
    }

    if (user.StatusPass === 'Reiniciar') {
      return res.status(200).json({ message: 'Debes reiniciar tu contraseña', statusPass: 'Reiniciar', user: { dpi: user.DPI } });
    }

    // Login exitoso normal
    return res.status(200).json({
      message: 'Login exitoso',
      user: {
        id: user.IdUsuario,
        dpi: user.DPI,
        nombre: user.Nombre,
        rol: user.Rol,
        especialidad: user.Especialidad,
      },
    });
  } catch (err) {
    console.error('Error al ejecutar la consulta:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: err });
  }
};
export const listarUsuarios = async (req: Request, res: Response) => {
  try {
    const [results] = await dbConnection
      .query<RowDataPacket[]>('SELECT * FROM Usuario where Rol="Paciente" AND StatusUsuario="Activo"');

    return res.status(200).json({
      message: 'Usuarios obtenidos correctamente',
      users: results,
    });
  } catch (err) {
    console.error('Error al obtener Usuarios:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: err });
  }
};
export const listarDoctores = async (req: Request, res: Response) => {
  try {
    const [results] = await dbConnection
      .query<RowDataPacket[]>('SELECT * FROM Usuario where Rol="Doctor" AND StatusUsuario="Activo"');

    return res.status(200).json({
      message: 'Usuarios obtenidos correctamente',
      users: results,
    });
  } catch (err) {
    console.error('Error al obtener Usuarios:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: err });
  }
};
export const listarEnfermeros = async (req: Request, res: Response) => {
  try {
    const [results] = await dbConnection
      .query<RowDataPacket[]>('SELECT * FROM Usuario where Rol="Enfermero" AND StatusUsuario="Activo"');

    return res.status(200).json({
      message: 'Usuarios obtenidos correctamente',
      users: results,
    });
  } catch (err) {
    console.error('Error al obtener Usuarios:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: err });
  }
};
export const listarFarmacia = async (req: Request, res: Response) => {
  try {
    const [results] = await dbConnection
      .query<RowDataPacket[]>('SELECT * FROM Usuario where Rol="Farmacia" AND StatusUsuario="Activo"');

    return res.status(200).json({
      message: 'Usuarios obtenidos correctamente',
      users: results,
    });
  } catch (err) {
    console.error('Error al obtener Usuarios:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: err });
  }
};
export const listarLaboratorio = async (req: Request, res: Response) => {
  try {
    const [results] = await dbConnection
      
      .query<RowDataPacket[]>('SELECT * FROM Usuario where Rol="Laboratorio" AND StatusUsuario="Activo"');

    return res.status(200).json({
      message: 'Usuarios obtenidos correctamente',
      users: results,
    });
  } catch (err) {
    console.error('Error al obtener Usuarios:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: err });
  }
};
export const obtenerUsuarioPorDPI = async (req: Request, res: Response) => {
  const { DPI } = req.body as { DPI: string };

  if (!DPI) {
    return res.status(400).json({ message: 'Falta el DPI' });
  }

  try {
    // Solo filtramos por DPI
    const [results] = await dbConnection
      .query<RowDataPacket[]>('SELECT * FROM Usuario WHERE DPI = ?', [DPI]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0];

    return res.status(200).json({
      message: 'Usuarios obtenidos correctamente',
      users: results,
    });
  } catch (err) {
    console.error('Error al obtener Usuarios:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: err });
  }
};
export const ListaMedicamentos = async (req: Request, res: Response) => {
  const { DPI } = req.body as { DPI: string };

  // Validar que venga el DPI
  if (!DPI) {
    return res.status(400).json({ message: "Falta el DPI" });
  }

  try {
    // Consulta SQL: filtra las fichas y medicamentos por el DPI del paciente
    const [results] = await dbConnection
      .query<RowDataPacket[]>(
        `
        SELECT
            fm.IdFactura,
            fm.DPIPaciente,
            fm.NombrePaciente,
            fm.NombreMedico,
            fm.EspecialidadMedico,
            fm.Fecha,
            fa.IdAccion,
            fa.Accion AS TipoAccion,
            fa.NombreAccion AS Medicamento,
            fa.Cantidad,
            fa.Frecuencia,
            fa.StatusAccion
        FROM fichamedica fm
        INNER JOIN FichaAccion fa
            ON fm.IdFactura = fa.IdFactura
        WHERE fa.Accion = 'Medicamento' AND fa.StatusAccion='Asignado'
          AND fm.DPIPaciente = ?
        ORDER BY fm.Fecha DESC, fm.IdFactura, fa.IdAccion;
        `,
        [DPI]
      );

    // Siempre retornar 200, aunque no haya registros
    return res.status(200).json({
      message: "Fichas médicas obtenidas correctamente",
      fichas: results || [],
    });
  } catch (err) {
    console.error("Error al obtener fichas médicas:", err);
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: err });
  }
};
export const obtenerAsignacionPorDPI = async (req: Request, res: Response) => {
  const { DPI } = req.body;

  if (!DPI) {
    return res.status(400).json({ message: "Falta el DPI del paciente" });
  }

  try {
    // Consulta para verificar si existe asignación
    const query = `
      SELECT *
      FROM EnfermeroAsignado
      WHERE DPIPaciente = ?
      ORDER BY FechaAsignacion DESC
      LIMIT 1
    `;

    const [results] = await dbConnection.query(query, [DPI]);

    if ((results as RowDataPacket[]).length === 0) {
      return res.status(404).json({ message: "No hay asignación para este paciente" });
    }

    return res.status(200).json({
      message: "Asignación encontrada",
      asignacion: (results as RowDataPacket[])[0],
    });
  } catch (err) {
    console.error("Error al obtener asignación:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const listarCitas = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT *
      FROM Citas
    `;

    const [results] = await dbConnection.query(query);

    return res.status(200).json({
      message: "Citas obtenidas correctamente",
      citas: results
    });
  } catch (err) {
    console.error("Error al obtener Citas:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const listarCitasPorDPI = async (req: Request, res: Response) => {
  const { DPI } = req.body;

  if (!DPI) {
    return res.status(400).json({ message: "Falta el DPI" });
  }

  try {
    const query = `
      SELECT *
      FROM Citas
      WHERE DPI = ?
      ORDER BY FechaCita ASC, IdCita ASC
    `;

    const [results] = await dbConnection.query(query, [DPI]);

    if ((results as any).length === 0) {
      return res.status(404).json({ message: "No se encontraron Citas para este DPI" });
    }

    return res.status(200).json({
      message: "Citas obtenidas correctamente",
      citas: results
    });
  } catch (err) {
    console.error("Error al obtener Citas por DPI:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const listarCitasPorDoctor = async (req: Request, res: Response) => {
  const { NombreDoctor } = req.body;

  if (!NombreDoctor) {
    return res.status(400).json({ message: "Falta el Especialista" });
  }

  try {
    const query = `
          SELECT *
          FROM Citas
          where NombreEspecialista=? AND Estado="Asignada"
          ORDER BY FechaCita ASC, IdCita ASC
    `;

    const [results] = await dbConnection.query(query, [NombreDoctor]);

    if ((results as any).length === 0) {
      return res.status(404).json({ message: "No se encontraron Citas para este Especialista" });
    }

    return res.status(200).json({
      message: "Citas obtenidas correctamente",
      citas: results
    });
  } catch (err) {
    console.error("Error al obtener Citas por Especialista:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const listaEspecialidades = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT DISTINCT(Especialidad) FROM Usuario where Rol="Doctor" AND StatusUsuario="Activo" AND Especialidad!="General"
    `;

    const [results] = await dbConnection.query(query);

    return res.status(200).json({
      message: "Citas obtenidas correctamente",
      citas: results
    });
  } catch (err) {
    console.error("Error al obtener Citas:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const obtenerFichasPorDPI = async (req: Request, res: Response) => {
  const { dpi } = req.body; // <-- aquí

  if (!dpi) {
    return res.status(400).json({ message: "Falta el DPI del paciente" });
  }

  try {
    const query = `
      SELECT
        fm.IdFactura,
        fm.DPIPaciente,
        fm.NombrePaciente,
        fm.NombreMedico AS Doctor,
        fm.EspecialidadMedico,
        fm.Fecha
      FROM FichaMedica fm
      WHERE fm.DPIPaciente = ?
      ORDER BY fm.Fecha DESC
    `;

    const [result] = await dbConnection.query(query, [dpi]);

    return res.status(200).json({
      message: "Fichas médicas obtenidas correctamente",
      fichas: result
    });

  } catch (err) {
    console.error("Error al obtener fichas médicas:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const obtenerDetalleFichaPorIdFactura = async (req: Request, res: Response) => {
  const { IdFactura } = req.body as { IdFactura: number };

  if (!IdFactura) {
    return res.status(400).json({ message: "Falta el IdFactura" });
  }

  try {
    const query = `
      SELECT
        fm.IdFactura,
        fm.DPIPaciente,
        fm.NombrePaciente,
        fm.NombreMedico,
        fm.EspecialidadMedico,
        fm.Fecha,
        fm.Observaciones,
        fa.IdAccion,
        fa.Accion AS TipoAccion,
        fa.NombreAccion,
        fa.Cantidad,
        fa.StatusAccion,
        fa.Frecuencia
      FROM FichaMedica fm
      LEFT JOIN FichaAccion fa
        ON fm.IdFactura = fa.IdFactura
      WHERE fm.IdFactura = ?
      ORDER BY fa.IdAccion;
    `;

    const [result] = await dbConnection.query(query, [IdFactura]);

    if ((result as any).length === 0) {
      return res.status(404).json({ message: "No se encontró la ficha médica" });
    }

    return res.status(200).json({
      message: "Detalle de ficha médica obtenido correctamente",
      detalle: result,
    });
  } catch (err) {
    console.error("Error al obtener detalle de ficha médica:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const listarEnfermeroAsignado = async (req: Request, res: Response) => {
  const { nombreEnfermero } = req.body;

  if (!nombreEnfermero) {
    return res.status(400).json({ message: 'Falta el nombre del enfermero' });
  }

  try {
    const [results] = await dbConnection
      
      .query<RowDataPacket[]>(
        'SELECT * FROM EnfermeroAsignado WHERE NombreEnfermero = ? ORDER BY FechaAsignacion DESC',
        [nombreEnfermero]
      );

    return res.status(200).json({
      message: 'Asignaciones de enfermeros obtenidas correctamente',
      asignaciones: results,
    });
  } catch (err) {
    console.error('Error al obtener asignaciones de enfermeros:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: err });
  }
};
export const detalleGastos = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
          g.ID,
          g.DPIPaciente,
          g.NombrePaciente,
          g.TipoGasto,
          g.NombreGasto,
          p.PrecioUnitario,
          g.Cantidad,
          (COALESCE(p.PrecioUnitario, 0) * g.Cantidad) AS TotalGasto,
          g.Fecha
      FROM Gastos g
      LEFT JOIN Precios p 
          ON p.Nombre = (
              CASE 
                  WHEN g.TipoGasto = 'Consulta' THEN g.NombreGasto
                  ELSE g.TipoGasto
              END
          )
      WHERE g.StatusGasto = 'Pendiente'
      ORDER BY g.Fecha DESC;
    `;

    const [results] = await dbConnection.query<RowDataPacket[]>(query);

    return res.status(200).json({
      message: "Detalle de gastos obtenido correctamente",
      gastos: results,
    });
  } catch (err) {
    console.error("Error al obtener detalle de gastos:", err);
    return res.status(500).json({
      message: "Error en el servidor",
      error: err,
    });
  }
};
export const detalleGastosPorDPI = async (req: Request, res: Response) => {
  const { DPI } = req.body;

  if (!DPI) {
    return res.status(400).json({ message: "Falta el DPI del paciente" });
  }

  try {
    const query = `
      SELECT 
          g.ID,
          g.DPIPaciente,
          g.NombrePaciente,
          g.TipoGasto,
          g.NombreGasto,
          p.PrecioUnitario,
          g.Cantidad,
          (COALESCE(p.PrecioUnitario, 0) * g.Cantidad) AS TotalGasto,
          g.Fecha
      FROM Gastos g
      LEFT JOIN Precios p 
          ON p.Nombre = (
              CASE 
                  WHEN g.TipoGasto = 'Consulta' THEN g.NombreGasto
                  ELSE g.TipoGasto
              END
          )
      WHERE g.DPIPaciente = ? AND g.StatusGasto = 'Pendiente'
      ORDER BY g.Fecha DESC;
    `;

    const [results] = await dbConnection.query<RowDataPacket[]>(query, [DPI]);

    if (results.length === 0) {
      return res.status(404).json({ message: "No se encontraron gastos para este paciente" });
    }

    return res.status(200).json({
      message: "Detalle de gastos por paciente obtenido correctamente",
      gastos: results,
    });
  } catch (err) {
    console.error("Error al obtener detalle de gastos por DPI:", err);
    return res.status(500).json({
      message: "Error en el servidor",
      error: err,
    });
  }
};
export const listarPagos = async (req: Request, res: Response) => {
  try {
    const query = `SELECT * FROM Pagos`;
    const [results] = await dbConnection.query<RowDataPacket[]>(query);

    return res.status(200).json({
      message: "Pagos obtenidos correctamente",
      pagos: results,
    });
  } catch (err) {
    console.error("Error al obtener pagos:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const listarPagosPorDPI = async (req: Request, res: Response) => {
  const { DPI } = req.body;

  if (!DPI) {
    return res.status(400).json({ message: "Falta el DPI del paciente" });
  }

  try {
    const query = `SELECT * FROM Pagos WHERE DPIPaciente = ?`;
    const [results] = await dbConnection.query<RowDataPacket[]>(query, [DPI]);

    if (results.length === 0) {
      return res.status(404).json({ message: "No se encontraron pagos para este paciente" });
    }

    return res.status(200).json({
      message: "Pagos obtenidos correctamente",
      pagos: results,
    });
  } catch (err) {
    console.error("Error al obtener pagos por DPI:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const resumenPagosPorTipo = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        TipoGasto,
        SUM(Total) AS TotalPagado,
        MAX(FechaPago) AS FechaUltimoPago
      FROM Pagos
      GROUP BY TipoGasto
      ORDER BY TotalPagado DESC
    `;

    const [results] = await dbConnection.query<RowDataPacket[]>(query);

    return res.status(200).json({
      message: "Resumen de pagos por tipo obtenido correctamente",
      resumen: results
    });
  } catch (err) {
    console.error("Error al obtener resumen de pagos:", err);
    return res.status(500).json({
      message: "Error en el servidor",
      error: err
    });
  }
};
export const resumenGastosPorTipo = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT
        g.TipoGasto,
        SUM(COALESCE(p.PrecioUnitario, 0) * g.Cantidad) AS TotalGasto,
        MAX(g.Fecha) AS FechaUltimoGasto
      FROM Gastos g
      LEFT JOIN Precios p
        ON p.Nombre = (
            CASE
              WHEN g.TipoGasto = 'Consulta' THEN g.NombreGasto
              ELSE g.TipoGasto
            END
        )
      GROUP BY g.TipoGasto
      ORDER BY TotalGasto DESC
    `;

    const [results] = await dbConnection.query<RowDataPacket[]>(query);

    return res.status(200).json({
      message: "Resumen de gastos por tipo obtenido correctamente",
      resumen: results
    });
  } catch (err) {
    console.error("Error al obtener resumen de gastos:", err);
    return res.status(500).json({
      message: "Error en el servidor",
      error: err
    });
  }
};

// Insertar datos
export const insertarUsuario = async (req: Request, res: Response) => {
  const {
    dpi,
    nombre,
    rol,
    especialidad,
    correoUsuario,
    correoFamiliar,
    edad,
    contrasena,
  } = req.body;

  // Validaciones
  if (
    !dpi ||
    !nombre ||
    !rol ||
    !especialidad ||
    !correoUsuario ||
    !edad ||
    !contrasena
  ) {
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios para registrar Usuario" });
  }

  try {
    // Insertar datos directamente sin encriptar contraseña
    const [result] = await dbConnection.query(
      `
      INSERT INTO Usuario 
      (DPI, Nombre, Rol, Especialidad, CorreoUsuario, CorreoFamiliar, Password, Edad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        dpi,
        nombre,
        rol,
        especialidad,
        correoUsuario,
        correoFamiliar || null,
        contrasena, // 🔹 Se guarda tal cual
        edad,
      ]
    );

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      userId: (result as any).insertId,
    });
  } catch (err) {
    console.error("Error al insertar Usuario:", err);
    return res
      .status(500)
      .json({ message: "Error al insertar Usuario", error: err });
  }
};
export const insertarFicha = async (req: Request, res: Response) => {
  const { dpi, nombrePaciente, nombreMedico, especialidadMedico, observaciones, acciones } = req.body;

  // Validaciones
  if (!dpi || !nombrePaciente || !nombreMedico || !especialidadMedico || !acciones?.length) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  const connection = dbConnection;

  try {
    // 1️⃣ Insertar la ficha médica (cabecera)
    const [fichaResult] = await connection.query(
      `INSERT INTO FichaMedica 
       (DPIPaciente, NombrePaciente, NombreMedico, EspecialidadMedico, Observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [dpi, nombrePaciente, nombreMedico, especialidadMedico, observaciones || null]
    );

    const idFactura = (fichaResult as any).insertId;

    // 2️⃣ Insertar todas las acciones (detalle)
    const accionesValues = acciones.map((accion: any) => {
      const status =
        accion.tipo === "Medicamento" ? "Asignado" :
          accion.tipo === "Examen" ? "Pendiente" :
            "Desconocido";

      return [
        idFactura,
        accion.tipo,          // Accion
        accion.nombre,         // NombreAccion
        accion.cantidad || 1,  // Cantidad
        accion.frecuencia || null, // Frecuencia
        status                 // StatusAccion
      ];
    });

    await connection.query(
      `INSERT INTO FichaAccion 
       (IdFactura, Accion, NombreAccion, Cantidad, Frecuencia, StatusAccion)
       VALUES ?`,
      [accionesValues]
    );

    // 3️⃣ Insertar en tabla Gastos por cada acción
    const gastosValues = acciones.map((accion: any) => [
      dpi,
      nombrePaciente,
      accion.tipo, // TipoGasto
      accion.nombre, // NombreGasto
      accion.cantidad || 1,
    ]);
    let nombreGasto = especialidadMedico === "General" ? "General" : "Especialista";
    // 4️⃣ Agregar gasto fijo de consulta (con la especialidad)
    gastosValues.push([
      dpi,
      nombrePaciente,
      "Consulta",       // TipoGasto
      nombreGasto, // NombreGasto
      1,                 // Cantidad
    ]);

    await connection.query(
      `INSERT INTO Gastos (DPIPaciente, NombrePaciente, TipoGasto, NombreGasto, Cantidad)
       VALUES ?`,
      [gastosValues]
    );

    // ✅ Todo bien
    return res.status(201).json({
      message: "Ficha médica y gastos registrados correctamente",
      idFactura,
    });

  } catch (err) {
    console.error("Error al insertar ficha médica:", err);
    return res.status(500).json({
      message: "Error al insertar ficha médica",
      error: err,
    });
  }
};
export const asignarEnfermero = async (req: Request, res: Response) => {
  const { dpiPaciente, nombrePaciente, nombreEnfermero } = req.body;

  if (!dpiPaciente || !nombrePaciente || !nombreEnfermero) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const query = `
      INSERT INTO EnfermeroAsignado (DPIPaciente, NombrePaciente, NombreEnfermero)
      VALUES (?, ?, ?)
    `;

    const [result] = await dbConnection
      
      .query(query, [dpiPaciente, nombrePaciente, nombreEnfermero]);

    return res.status(201).json({
      message: "Enfermero asignado correctamente",
      asignacionId: (result as any).insertId,
    });
  } catch (err) {
    console.error("Error al asignar enfermero:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const crearCita2 = async (req: Request, res: Response) => {
  const {
    dpiPaciente,
    nombrePaciente,
    doctorRefiere,
    nombreEspecialista,
    especialidad,
    razon
  } = req.body;

  // Validar datos obligatorios
  if (!dpiPaciente || !nombrePaciente || !doctorRefiere || !nombreEspecialista || !especialidad) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const query = `
      INSERT INTO Citas 
        (DPI, NombrePaciente, NombreDoctor, NombreEspecialista, Especialidad, Razon, Estado, FechaCita)
      VALUES (?, ?, ?, ?, ?, ?, 'Pendiente', NULL)
    `;

    const [result] = await dbConnection
      
      .query(query, [
        dpiPaciente,
        nombrePaciente,
        doctorRefiere,        // médico que refiere
        nombreEspecialista,   // especialista asignado
        especialidad,
        razon
      ]);

    return res.status(201).json({
      message: "Cita creada correctamente",
      idCita: (result as any).insertId
    });

  } catch (err) {
    console.error("Error al crear cita:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const crearCita = async (req: Request, res: Response) => {
  const {
    dpiPaciente,
    nombrePaciente,
    doctorRefiere,
    nombreEspecialista,
    especialidad,
    razon
  } = req.body;

  // Validar datos obligatorios
  if (!dpiPaciente || !nombrePaciente || !doctorRefiere || !nombreEspecialista || !especialidad) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    // Insertar la cita
    const query = `
      INSERT INTO Citas 
        (DPI, NombrePaciente, NombreDoctor, NombreEspecialista, Especialidad, Razon, Estado, FechaCita)
      VALUES (?, ?, ?, ?, ?, ?, 'Pendiente', NULL)
    `;

    const [result] = await dbConnection
      
      .query(query, [
        dpiPaciente,
        nombrePaciente,
        doctorRefiere,        // médico que refiere
        nombreEspecialista,   // especialista asignado
        especialidad,
        razon
      ]);

    const idCita = (result as any).insertId;

    // Obtener correo del paciente
    const [rows] = await dbConnection
      
      .query('SELECT CorreoFamiliar FROM Usuario WHERE DPI = ?', [dpiPaciente]);

    if ((rows as any).length > 0) {
      const correoPaciente = (rows as any)[0].CorreoFamiliar;

      // Construir mensaje HTML
      const mensaje = `
        Informamos que el paciente: ${nombrePaciente} <br>
        con el DPI: ${dpiPaciente} <br><br>
        fue puesto en revisión médica por el Doctor: ${doctorRefiere} <br>
        se refirió a: ${nombreEspecialista}, especialista en: ${especialidad} <br>
        por la razón de: ${razon}
      `;

      // Enviar correo
      await sendResetEmail(correoPaciente, mensaje); // puedes crear una función genérica sendEmail si quieres
    }

    return res.status(201).json({
      message: "Cita creada correctamente y correo enviado",
      idCita
    });

  } catch (err) {
    console.error("Error al crear cita:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const insertarPago = async (req: Request, res: Response) => {
  const {
    idCobro,
    DPIPaciente,
    NombrePaciente,
    TipoGasto,
    NombreGasto,
    Cantidad,
    PrecioUnitario
  } = req.body;

  if (idCobro === undefined || DPIPaciente === undefined || DPIPaciente === null || !NombrePaciente || !TipoGasto || !NombreGasto || Cantidad === undefined || PrecioUnitario === undefined) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para registrar el pago' });
  }


  try {
    const Total = Cantidad * PrecioUnitario;

    // 1️⃣ Insertar en Pagos
    const insertQuery = `
      INSERT INTO Pagos
      (IdCobro, DPIPaciente, NombrePaciente, TipoGasto, NombreGasto, Cantidad, PrecioUnitario, Total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await dbConnection.query(insertQuery, [
      idCobro,
      DPIPaciente,
      NombrePaciente,
      TipoGasto,
      NombreGasto,
      Cantidad,
      PrecioUnitario,
      Total
    ]);

    // Solo actualizar gastos si idCobro > 0
    if (idCobro > 0) {
      const updateQuery = `
    UPDATE gastos
    SET StatusGasto = 'Pagado'
    WHERE ID = ?
  `;
      await dbConnection.query(updateQuery, [idCobro]);
    }

    return res.status(201).json({
      message: 'Pago registrado correctamente',
      idCobro: idCobro,
      Total
    });

  } catch (err) {
    console.error('Error al insertar pago:', err);
    return res.status(500).json({ message: 'Error en el servidor', error: (err as Error).message });
  }
};


// Actualizar datos
export const actualizarUsuario = async (req: Request, res: Response) => {
  const {
    dpi,
    nombre,
    rol,
    especialidad,
    correoUsuario,
    correoFamiliar,
    edad,
  } = req.body;

  // Validaciones
  const edadNum = Number(edad);
  if (!dpi || !nombre || !rol || !correoUsuario || isNaN(edadNum)) {
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios para actualizar Usuario" });
  }

  try {
    // Actualiza los campos excepto contraseña
    const [result] = await dbConnection.query(
      `
      UPDATE Usuario
      SET Nombre = ?,
          Rol = ?,
          Especialidad = ?,
          CorreoUsuario = ?,
          CorreoFamiliar = ?,
          Edad = ?
      WHERE DPI = ?
      `,
      [
        nombre,
        rol,
        especialidad || null,
        correoUsuario,
        correoFamiliar || null,
        edadNum,
        dpi,
      ]
    );

    return res.status(200).json({
      message: "Usuario actualizado correctamente",
      affectedRows: (result as any).affectedRows,
    });
  } catch (err) {
    console.error("Error al actualizar Usuario:", err);
    return res
      .status(500)
      .json({ message: "Error al actualizar Usuario", error: err });
  }
};
export const actualizarEnfermeroAsignado = async (req: Request, res: Response) => {
  const { idAsignacion, nombreEnfermero } = req.body;

  if (!idAsignacion || !nombreEnfermero) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const query = `
      UPDATE EnfermeroAsignado
      SET NombreEnfermero = ?
      WHERE IdAsignacion = ?
    `;

    const [result] = await dbConnection
      
      .query(query, [nombreEnfermero, idAsignacion]);

    const affectedRows = (result as any).affectedRows;
    if (affectedRows === 0) {
      return res.status(404).json({ message: "No se encontró la asignación" });
    }

    return res.status(200).json({
      message: "Nombre del enfermero actualizado correctamente",
      idAsignacion,
    });
  } catch (err) {
    console.error("Error al actualizar enfermero:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const actualizarCita = async (req: Request, res: Response) => {
  const { idCita, fechaCita } = req.body;

  // Validar datos obligatorios
  if (!idCita || !fechaCita) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const query = `
      UPDATE Citas
      SET FechaCita = ?, Estado = 'Asignada'
      WHERE IdCita = ?
    `;

    const [result] = await dbConnection
      
      .query(query, [fechaCita, idCita]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    return res.status(200).json({
      message: "Cita actualizada correctamente",
      idCita,
      nuevaFecha: fechaCita
    });

  } catch (err) {
    console.error("Error al actualizar cita:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const actualizarEstadoCita = async (req: Request, res: Response) => {
  const { idCita, estado } = req.body;

  // Validar datos
  if (!idCita || !estado) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  // Validar que el estado sea válido
  const estadosValidos = ["Pendiente", "Completada", "Cancelada"];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ message: "Estado no válido" });
  }

  try {
    const query = `
      UPDATE citas
      SET Estado = ?
      WHERE IdCita = ?
    `;

    const [result] = await dbConnection.query(query, [estado, idCita]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "No se encontró la cita con ese Id" });
    }

    return res.status(200).json({
      message: "Estado de la cita actualizado correctamente",
    });
  } catch (err) {
    console.error("Error al actualizar estado de cita:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};
export const resetPassword = async (DPI: string) => {
  if (!DPI) throw new Error('DPI es requerido');

  // Asegurarse que DPI es string
  DPI = String(DPI).trim();

  // Generar nueva contraseña
  const newPassword = generarPasswordRandom();

  // Actualizar la tabla Usuario
  await dbConnection
    
    .query(
      'UPDATE Usuario SET StatusPass = ?, Password = ? WHERE DPI = ?',
      ['Reiniciar', newPassword, DPI]
    );

  // Obtener correo del usuario
  const [rows] = await dbConnection
    
    .query('SELECT CorreoUsuario FROM Usuario WHERE DPI = ?', [DPI]);

  if ((rows as any).length === 0) throw new Error('Usuario no encontrado');

  const correo = (rows as any)[0].CorreoUsuario;

  // Enviar correo con la nueva contraseña
  await sendResetEmail(correo, `Tu nueva contraseña es: ${newPassword}`);

  return true;
};
export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { DPI } = req.body;

    if (!DPI) {
      return res.status(400).json({ message: 'DPI es requerido' });
    }

    await resetPassword(DPI);

    return res.status(200).json({ message: 'Se ha enviado la nueva contraseña al correo del usuario.' });
  } catch (error: any) {
    console.error('Error resetPasswordHandler:', error.message || error);
    return res.status(500).json({ message: error.message || 'Error al resetear la contraseña' });
  }
};
export const cambiopass = async (req: Request, res: Response) => {
  const { dpi, newPassword } = req.body;

  if (!dpi || !newPassword) {
    return res.status(400).json({ message: "DPI y nueva contraseña son obligatorios" });
  }

  try {
    const [result] = await dbConnection.query(
      `
        UPDATE Usuario
        SET StatusPass = 'Activo',
            Password = ?
        WHERE DPI = ?
        `,
      [newPassword, dpi]
    );


    return res.status(200).json({
      message: "Usuario actualizado correctamente",
      affectedRows: (result as any).affectedRows,
    });
  } catch (err) {
    console.error("Error al actualizar Usuario:", err);
    return res.status(500).json({ message: "Error al actualizar Usuario", error: err });
  }
};



// Eliminar datos
export const suspenderUsuario = async (req: Request, res: Response) => {
  const { dpi } = req.body;

  if (!dpi) {
    return res.status(400).json({ message: "DPI es obligatorio para suspender Usuario" });
  }

  try {
    const [result] = await dbConnection.query(
      `
      UPDATE Usuario
      SET StatusUsuario = 'Suspendido'
      WHERE DPI = ?
      `,
      [dpi]
    );

    return res.status(200).json({
      message: "Usuario suspendido correctamente",
      affectedRows: (result as any).affectedRows,
    });
  } catch (err) {
    console.error("Error al suspender Usuario:", err);
    return res.status(500).json({ message: "Error al suspender Usuario", error: err });
  }
};

export const ActualizarStatusMedicamento = async (req: Request, res: Response) => {
  const { IdAccion, nuevoStatus } = req.body as { IdAccion: number; nuevoStatus: string };

  // Validar que vengan los datos necesarios
  if (!IdAccion || !nuevoStatus) {
    return res.status(400).json({ message: "Falta IdAccion o nuevoStatus" });
  }

  try {
    // Actualizar el status del medicamento
    const [result] = await dbConnection
      
      .query(
        `
        UPDATE FichaAccion
        SET StatusAccion = ?
        WHERE IdAccion = ?;
        `,
        [nuevoStatus, IdAccion]
      );

    // Verificar si se actualizó algún registro
    // result.affectedRows está disponible en MySQL para ver cuántas filas se modificaron
    const affectedRows = (result as any).affectedRows;
    if (affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró el medicamento con ese IdAccion" });
    }

    return res.status(200).json({
      message: "Status del medicamento actualizado correctamente",
      IdAccion,
      nuevoStatus,
    });
  } catch (err) {
    console.error("Error al actualizar el status del medicamento:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err });
  }
};

