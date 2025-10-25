import { Router } from 'express';
import { login,listarUsuarios,listarDoctores,listarEnfermeros, 
    listarFarmacia,listarLaboratorio, obtenerUsuarioPorDPI,
    insertarUsuario,actualizarUsuario,suspenderUsuario,insertarFicha,
    ListaMedicamentos,ActualizarStatusMedicamento,asignarEnfermero,
    actualizarEnfermeroasignado,obtenerAsignacionPorDPI,crearCita,
actualizarCita,listarCitas,listarCitasPorDPI,actualizarEstadoCita,
listaEspecialidades, obtenerFichasPorDPI,obtenerDetalleFichaPorIdFactura,
listarEnfermeroasignado,listarCitasPorDoctor,detalleGastos,
detalleGastosPorDPI,insertarPago,listarPagos,listarPagosPorDPI,resumenPagosPorTipo,resumenGastosPorTipo,
resetPasswordHandler,cambiopass } from '../controllers/user.controller';

const router = Router();

// Selects de datos
router.post('/', login);
router.get('/pacientes', listarUsuarios);
router.get('/doctores', listarDoctores);
router.get('/enfermeros', listarEnfermeros);
router.get('/farmacia', listarFarmacia);
router.get('/laboratorio', listarLaboratorio);
router.post('/datos', obtenerUsuarioPorDPI);
router.post('/medicamentos', ListaMedicamentos);
router.post('/asignacionenfermero', obtenerAsignacionPorDPI);
router.get('/citas', listarCitas);
router.post('/citasusuario', listarCitasPorDPI);
router.get('/especialidades', listaEspecialidades);
router.post('/fichasusuario', obtenerFichasPorDPI);
router.post('/detalleficha', obtenerDetalleFichaPorIdFactura);
router.post('/enfermeroasignado', listarEnfermeroasignado);
router.post('/citasdoctor', listarCitasPorDoctor);
router.post('/detallegastos', detalleGastos);
router.post('/detallegastosusuario', detalleGastosPorDPI);
router.get('/pagos', listarPagos);
router.post('/pagosusuario', listarPagosPorDPI);
router.get('/resumenpagostipo', resumenPagosPorTipo);
router.get('/resumengastostipo', resumenGastosPorTipo);
// Insertar datos
router.post("/agregar", insertarUsuario);
router.post("/cita", insertarFicha);
router.post("/asignarenfermero", asignarEnfermero);
router.post("/crearcita", crearCita);
router.post("/pagogasto", insertarPago);
router.post("/resetpassword", resetPasswordHandler);
// Actualizar datos
router.put("/editar", actualizarUsuario);
router.put("/actualizarenfermero", actualizarEnfermeroasignado);
router.post('/actualizarcita', actualizarCita);
router.put('/actualizarestadocita', actualizarEstadoCita);
router.post("/cambiopass", cambiopass);
// Eliminar datos
router.put("/suspender", suspenderUsuario);
router.post("/quitar", ActualizarStatusMedicamento);


export default router;