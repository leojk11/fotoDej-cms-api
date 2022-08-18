# FotoDej CMS API

## Api URL
https://foto-dej-cms-api.herokuapp.com/

## Postman documentation
https://documenter.getpostman.com/view/14487622/VUjTmPW7

# Models

## User
- id: string
- firstname: string
- lastname: string
- fullname: string
- email: string
- role: string
- account_status: string
- online_status: string
- number_of_created_albums: number
- number_of_schedules: number
- number_of_completed_schedules: number
- created_date: string
- created_time: string
- created_by: { id: string, firstname: string; lastname: string, fullname: string; email: string; username: string; role: string; profile_image: string }
- modified_date: string
- modified_time: string
- modified_by: { id: string, firstname: string; lastname: string, fullname: string; email: string; username: string; role: string; profile_image: string }
- active: boolean

## Client
- id: string
- firstname: string
- lastname: string
- fullname: string
- phone_number: string
- email: string
- profile_image: string
- number_of_albums: number
- created_date: string
- created_time: string
- created_by: { id: string, firstname: string; lastname: string, fullname: string; email: string; username: string; role: string; profile_image: string }
- modified_date: string
- modified_time: string
- modified_by: { id: string, firstname: string; lastname: string, fullname: string; email: string; username: string; role: string; profile_image: string }
- active: boolean
- account_status: string
- deleted_by: { id: string, firstname: string; lastname: string, fullname: string; email: string; username: string; role: string; profile_image: string }
