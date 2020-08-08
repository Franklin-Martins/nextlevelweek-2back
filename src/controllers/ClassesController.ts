import { Request, Response } from 'express'
import db from '../database/connection';
import convertHourToMinute from '../utils/convertHourToMinute';

interface ScheduleItem{
    weekday: number;
    from: string;
    to:string
}

export default class ClassesController{

    async index(request:Request,response:Response){
        const filters = request.query;

        const subject = filters.subject as string
        const weekday = filters.weekday as string
        const time = filters.time as string


        if( !filters.weekday || !filters.subject || !filters.time ){
            return response.status(400).json({error: "Missing filters to search"})
        }

        const timeInMinutes = convertHourToMinute(time)

        const classes = await db('classes')
        .whereExists(function(){
            this.select('class_schedule.*')
            .from('class_schedule')
            .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
            .whereRaw('`class_schedule`.`weekday` = ??',[Number(weekday)])
            .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
            .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])
        })
        .where('classes.subject', '=', subject)
        .join('users', 'classes.user_id', '=', 'users.id')
        .select(['classes.*', 'users.*'])

        return response.json(classes)
    }

    async create(request:Request,response:Response){
        const { 
            name, 
            avatar, 
            whatsapp, 
            bio, 
            subject, 
            cost, 
            schedule 
        } = request.body;
    
        const trx = await db.transaction();
    
        try {
            const intsertedUsersId = await trx('users').insert({
                name, avatar, whatsapp, bio
            })
        
            const user_id = intsertedUsersId[0];
        
            const insertedClassesId = await trx('classes').insert({
                subject,
                cost,
                user_id
            })
        
            const class_id = insertedClassesId[0]
        
            const classSchedule = schedule.map((scheduleItem:ScheduleItem) =>{
                return {
                    class_id,
                    weekday: scheduleItem.weekday,
                    from: convertHourToMinute(scheduleItem.from),
                    to: convertHourToMinute(scheduleItem.to),
                }
            })
        
            await trx('class_schedule').insert(classSchedule)
        
            await trx.commit()
        
            return response.status(201).json({
                message: "successfully created"
            })
    
        } catch (error) {
            
            await trx.rollback()
    
            return response.status(400).json({
                message_error:"Unexpected error while creating new class"
            })
        }
    }
}