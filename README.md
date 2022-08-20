# FotoDej CMS API

## Api URL
https://foto-dej-cms-api.herokuapp.com/

## Postman documentation
https://documenter.getpostman.com/view/14487622/VUjTmPW7

# Models

## Admin
- id: string
- firstname: string
- lastname: string
- phone_number: string
- role: string
- username: string
- email: string
- profile_image: string

## CleanUser
- id: string
- firstname: string
- lastname: string
- fullname: string
- email: string
- username: string
- role: string
- profile_image: string

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
- created_by: CleanUser
- modified_date: string
- modified_time: string
- modified_by: CleanUser
- active: boolean
- deleted_by_id: string
- deleted_by: CleanUser

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
- created_by: CleanUser
- modified_date: string
- modified_time: string
- modified_by: CleanUser
- active: boolean
- account_status: string
- deleted_by_id: string
- deleted_by: CleanUser

## Album
- id: string
- title: string
- images: string[]
- images_count: number
- selected_images: string[]
- selected_images_count: number
- assigned_date: string
- assigned_to_id: string
- assigned_to: CleanUser
- assigned_by_id: string
- assigned_by: CleanUser
- created_date: string
- created_by_id: string
- created_by: CleanUser
- modified_date: string
- modified_by_id: string
- modified_by: CleanUser
- active: boolean
- deleted_by_id: string
- deleted_by: CleanUser
