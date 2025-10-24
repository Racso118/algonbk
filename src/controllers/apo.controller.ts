
import { Request, Response } from 'express';

// Obtener todos los usuarios
export const getAppoint = (req: Request, res: Response) => {
    res.status(200).json({ message: 'Obtener todos los apoints' });
};