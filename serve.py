import os
import json
import uuid
import datetime
import http.server
import socketserver
from email.parser import BytesParser
from email.policy import default

PORT = 5000
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), 'public')
DB_FILE = os.path.join(os.path.dirname(__file__), 'db.json')
UPLOAD_DIR = os.path.join(PUBLIC_DIR, 'uploads')

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper to read database
def read_db():
    if not os.path.exists(DB_FILE):
        # Initialize default mock database
        default_db = {
            "config": {
                "homeHeroTitle": "Transform Your Health, Love Your Body",
                "homeHeroSubtitle": "Achieve permanent results through personalized lifestyle guidance, high-energy Zumba sessions, and scientifically backed meal plans.",
                "homeHeroImage": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop",
                "contactPhone": "+91 98765 43210",
                "contactEmail": "info@preethinutrition.com",
                "contactAddress": "Preethi Nutrition Center, Main Road, Block A, Bangalore, India",
                "operatingHours": "Mon - Fri: 6:00 AM - 11:30 AM, 4:30 PM - 8:30 PM | Sat: 6:00 AM - 12:00 PM | Sun: Closed",
                "aboutHeroTitle": "Nurturing Healthy Lives",
                "aboutHeroSubtitle": "Providing premium, personalized wellness guidance that empowers you to make sustainable health choices.",
                "aboutMainContent": "Preethi Nutrition Center was founded on the belief that healthy living should be accessible, enjoyable, and tailored to the individual. Under the leadership of counselor Preethi Ma'am, we have spent over 15 years helping clients reshape their diets, increase energy, and manage chronic conditions.\n\nWe combine premium supplements, localized food habits, and active workouts like Zumba to build a comprehensive fitness profile that yields lifelong transformations.",
                "aboutMission": "To deliver evidence-based, customized nutrition guidelines and support structures that enable clients to reach their optimal body weight, boost cardiorespiratory health, and make lifestyle shifts.",
                "aboutVision": "To become a trusted community hub for total wellness, where physical movement, optimal cellular nutrition, and personal counseling converge to create vibrant, disease-free lifestyles.",
                "aboutExperienceYears": 15
            },
            "posts": [
                {
                    "_id": "sample1",
                    "type": "instagram",
                    "mediaUrl": "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=500&auto=format&fit=crop",
                    "mediaType": "image",
                    "caption": "Fuel your day with our high-protein wellness green bowl! Supercharged with vitamins and clean ingredients. #NutritionTips #PreethiWellness",
                    "createdAt": datetime.datetime.now().isoformat(),
                    "viewCount": 145,
                    "likes": [],
                    "comments": []
                },
                {
                    "_id": "sample2",
                    "type": "transformation",
                    "mediaUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=500&auto=format&fit=crop",
                    "mediaType": "image",
                    "beforeImageUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=500&auto=format&fit=crop",
                    "afterImageUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=500&auto=format&fit=crop&hue=90",
                    "clientName": "Neha Mehta",
                    "clientDetails": "Lost 12kg in 3 months",
                    "caption": "Unbelievable determination! Neha stuck to her portion-controlled diet and attended 4 Zumba sessions weekly. Absolutely proud!",
                    "createdAt": (datetime.datetime.now() - datetime.timedelta(days=1)).isoformat(),
                    "viewCount": 320,
                    "likes": [],
                    "comments": []
                },
                {
                    "_id": "sample3",
                    "type": "instagram",
                    "mediaUrl": "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=500&auto=format&fit=crop",
                    "mediaType": "image",
                    "caption": "Energy check! High-vibe Zumba workout to burn calories and shake off the monday blues. Have you booked your slot? #ZumbaFitness",
                    "createdAt": (datetime.datetime.now() - datetime.timedelta(days=2)).isoformat(),
                    "viewCount": 201,
                    "likes": [],
                    "comments": []
                }
            ],
            "products": [
                {
                    "_id": "prod1",
                    "name": "Herbalife Formula 1 Shake",
                    "price": 1950,
                    "stock": 45,
                    "description": "Nutrient-dense meal replacement shake mix with 9g protein and essential vitamins.",
                    "imageUrl": "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=500&auto=format&fit=crop",
                    "buyLink": "https://www.herbalife.com"
                },
                {
                    "_id": "prod2",
                    "name": "Personalized Protein Powder",
                    "price": 1250,
                    "stock": 30,
                    "description": "High quality soy and whey protein blend to satisfy hunger and maintain muscle mass.",
                    "imageUrl": "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=500&auto=format&fit=crop",
                    "buyLink": "https://www.herbalife.com"
                }
            ],
            "success": [],
            "blogs": [
                {
                    "_id": "blog1",
                    "title": "5 Essential Nutrients Every Senior Needs Daily",
                    "category": "old-age",
                    "summary": "Discover the key nutrients that help seniors maintain strength and cognitive health.",
                    "content": "Calcium, Vitamin D, B12, Omega-3, and Iron are critical for seniors. Here is how to get them through diet...",
                    "author": "Preethi Ma'am",
                    "date": datetime.datetime.now().strftime('%Y-%m-%d'),
                    "read_time": "6 min read"
                },
                {
                    "_id": "blog2",
                    "title": "The Anti-Acne Diet: Foods to Eat and Avoid",
                    "category": "skin",
                    "summary": "Your diet plays a 70% role in skin health. Learn what triggers and clears breakouts.",
                    "content": "Reducing glycemic load, eliminating dairy, and adding zinc-rich foods can dramatically improve skin health...",
                    "author": "Preethi Ma'am",
                    "date": datetime.datetime.now().strftime('%Y-%m-%d'),
                    "read_time": "5 min read"
                }
            ],
            "contacts": [],
            "appointments": []
        }
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_db, f, indent=2)
        return default_db
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

# Helper to write database
def write_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

class CustomHTTPRequestHandler(http.server.BaseHTTPRequestHandler):
    
    def send_json(self, status, payload):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def parse_multipart(self):
        content_type = self.headers.get('Content-Type', '')
        if 'multipart/form-data' not in content_type:
            return {}, {}
        
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length)
        
        msg_bytes = b"Content-Type: " + content_type.encode() + b"\r\n\r\n" + body_bytes
        msg = BytesParser(policy=default).parsebytes(msg_bytes)
        
        fields = {}
        files = {}
        for part in msg.iter_parts():
            name = part.get_param('name', header='content-disposition')
            filename = part.get_filename()
            if filename:
                file_data = part.get_payload(decode=True)
                files[name] = {
                    'filename': filename,
                    'data': file_data
                }
            else:
                fields[name] = part.get_payload()
        return fields, files

    def do_GET(self):
        path = self.path.split('?')[0]
        
        # Redirect obsolete /admin-login to /login
        if path == '/admin-login':
            self.send_response(302)
            self.send_header('Location', '/login')
            self.end_headers()
            return
            
        # API Routes
        if path == '/api/content' or path == '/api/about':
            db = read_db()
            self.send_json(200, {"success": True, "data": db.get("config", {})})
            return
            
        elif path == '/api/posts':
            db = read_db()
            from urllib.parse import urlparse, parse_qs
            qs = parse_qs(urlparse(self.path).query)
            category = qs.get('category', [None])[0]
            featured_only = qs.get('featured', [None])[0] == 'true'
            posts = db.get('posts', [])
            # Public API: only return published posts
            posts = [p for p in posts if p.get('isPublished', True)]
            if category and category != 'all':
                posts = [p for p in posts if p.get('category', '') == category]
            if featured_only:
                posts = [p for p in posts if p.get('featured', False)]
            self.send_json(200, {"success": True, "data": posts})
            return

        elif path == '/api/admin/posts':
            db = read_db()
            # Admin gets ALL posts including drafts
            self.send_json(200, {"success": True, "data": db.get('posts', [])})
            return
            
        elif path == '/api/products':
            db = read_db()
            self.send_json(200, {"success": True, "data": db.get("products", [])})
            return
            
        elif path == '/api/success':
            db = read_db()
            self.send_json(200, {"success": True, "data": db.get("success", [])})
            return
            
        elif path == '/api/blogs':
            db = read_db()
            self.send_json(200, {"success": True, "data": db.get("blogs", [])})
            return

        elif path == '/api/admin/contacts':
            db = read_db()
            self.send_json(200, db.get("contacts", []))
            return

        elif path == '/api/admin/appointments' or path == '/api/appointments':
            db = read_db()
            self.send_json(200, db.get("appointments", []))
            return
            
        # Clean URLs mapping
        clean_routes = [
            '/', '/about', '/services', '/diet', '/zumba', '/products', 
            '/success', '/blog', '/contact', '/login', '/admin', '/dashboard',
            '/weight-loss', '/weight-gain', '/diet-consultation', 
            '/nutrition-counseling', '/healthy-meal-planning', '/fitness-guidance'
        ]
        
        target_path = path
        if target_path in clean_routes:
            if target_path == '/':
                target_path = '/index.html'
            else:
                target_path = target_path + '.html'
        
        # Serve static files from public directory
        filepath = os.path.join(PUBLIC_DIR, target_path.lstrip('/'))
        if os.path.isfile(filepath):
            # Check mime type
            mime = "text/html"
            if filepath.endswith('.css'): mime = "text/css"
            elif filepath.endswith('.js'): mime = "application/javascript"
            elif filepath.endswith('.png'): mime = "image/png"
            elif filepath.endswith('.jpg') or filepath.endswith('.jpeg'): mime = "image/jpeg"
            elif filepath.endswith('.svg'): mime = "image/svg+xml"
            elif filepath.endswith('.mp4'): mime = "video/mp4"
            
            file_size = os.path.getsize(filepath)
            range_header = self.headers.get('Range')
            
            if range_header and range_header.startswith('bytes='):
                try:
                    ranges = range_header.split('=')[1].split('-')
                    start = int(ranges[0]) if ranges[0] else 0
                    end = int(ranges[1]) if len(ranges) > 1 and ranges[1] else file_size - 1
                    
                    if start >= file_size:
                        self.send_response(416) # Range Not Satisfiable
                        self.send_header('Content-Range', f'bytes */{file_size}')
                        self.end_headers()
                        return
                        
                    end = min(end, file_size - 1)
                    content_length = end - start + 1
                    
                    self.send_response(206)
                    self.send_header('Content-Type', mime)
                    self.send_header('Accept-Ranges', 'bytes')
                    self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                    self.send_header('Content-Length', str(content_length))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    with open(filepath, 'rb') as f:
                        f.seek(start)
                        self.wfile.write(f.read(content_length))
                    return
                except Exception as e:
                    # Fallback to standard 200 response if range parsing fails
                    pass
            
            # Serve the whole file
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Content-Length', str(file_size))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            with open(filepath, 'rb') as f:
                self.wfile.write(f.read())
            return
            
        # Return 404
        self.send_json(404, {"success": False, "message": "File or endpoint not found"})

    def do_POST(self):
        path = self.path.split('?')[0]
        db = read_db()
        
        # Read JSON body if JSON
        content_type = self.headers.get('Content-Type', '')
        post_data = {}
        if 'application/json' in content_type:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = json.loads(self.rfile.read(content_length).decode('utf-8'))

        # Authentication Routes
        if path == '/api/auth/login':
            email = post_data.get('email', '').strip().lower()
            password = post_data.get('password', '')
            
            if email == 'admin' and password == 'admin':
                email = 'admin@preethinutrition.com'
                password = 'AdminPass123!'
            
            if email == 'admin@preethinutrition.com' and password == 'AdminPass123!':
                user = {"id": "admin", "name": "Admin Preethi", "email": email, "role": "admin"}
                self.send_json(200, {"success": True, "token": "mock-admin-jwt-token-xyz", "user": user})
            else:
                # Default guest login
                user = {"id": str(uuid.uuid4()), "name": email.split('@')[0].capitalize(), "email": email, "role": "customer"}
                self.send_json(200, {"success": True, "token": "mock-customer-jwt-token-abc", "user": user})
            return
            
        elif path == '/api/auth/google':
            email = post_data.get('email', '').strip().lower()
            name = post_data.get('name', '').strip()
            isAdmin = email == 'preethiherbalife@gmail.com' or email == 'admin@preethinutrition.com'
            role = 'admin' if isAdmin else 'customer'
            user = {"id": str(uuid.uuid4()), "name": name, "email": email, "role": role}
            self.send_json(200, {"success": True, "token": "mock-admin-jwt-token-xyz" if isAdmin else "mock-customer-jwt-token-abc", "user": user})
            return
            
        elif path == '/api/auth/register':
            email = post_data.get('email', '').strip().lower()
            name = post_data.get('name', '').strip()
            user = {"id": str(uuid.uuid4()), "name": name, "email": email, "role": "customer"}
            self.send_json(200, {"success": True, "token": "mock-customer-jwt-token-abc", "user": user})
            return

        elif path == '/api/contact':
            db['contacts'].append({
                "_id": str(uuid.uuid4()),
                "name": post_data.get('name', ''),
                "phone": post_data.get('phone', ''),
                "email": post_data.get('email', ''),
                "service": post_data.get('service', ''),
                "message": post_data.get('message', ''),
                "responded": False,
                "date": datetime.datetime.now().strftime('%Y-%m-%d'),
                "createdAt": datetime.datetime.now().isoformat()
            })
            write_db(db)
            self.send_json(201, {"success": True, "message": "Message sent successfully"})
            return

        elif path == '/api/appointments':
            appt = {
                "_id": str(uuid.uuid4()),
                "customerName": post_data.get('customerName', 'Guest'),
                "customerEmail": post_data.get('customerEmail', 'guest@example.com'),
                "service": post_data.get('service', ''),
                "date": post_data.get('date', ''),
                "time": post_data.get('time', ''),
                "consultant": post_data.get('consultant', 'Preethi Ma\'am'),
                "notes": post_data.get('notes', ''),
                "status": "Pending",
                "createdAt": datetime.datetime.now().isoformat()
            }
            db['appointments'].append(appt)
            write_db(db)
            self.send_json(201, {"success": True, "data": appt})
            return

        # View increment
        elif path.startswith('/api/posts/') and path.endswith('/view'):
            post_id = path.split('/')[3]
            for post in db.get('posts', []):
                if post['_id'] == post_id:
                    post['viewCount'] = post.get('viewCount', 0) + 1
                    write_db(db)
                    self.send_json(200, {"success": True, "viewCount": post['viewCount']})
                    return
            self.send_json(404, {"success": False, "message": "Post not found"})
            return

        # Like toggle
        elif path.startswith('/api/posts/') and path.endswith('/like'):
            post_id = path.split('/')[3]
            # Get user from authorization header or mock
            auth_header = self.headers.get('Authorization', '')
            user_id = "mock-user-id"
            
            for post in db.get('posts', []):
                if post['_id'] == post_id:
                    if 'likes' not in post:
                        post['likes'] = []
                    if user_id in post['likes']:
                        post['likes'].remove(user_id)
                        liked = False
                    else:
                        post['likes'].append(user_id)
                        liked = True
                    write_db(db)
                    self.send_json(200, {"success": True, "liked": liked, "count": len(post['likes'])})
                    return
            self.send_json(404, {"success": False, "message": "Post not found"})
            return

        # Add comment
        elif path.startswith('/api/posts/') and path.endswith('/comments') and not path.split('/')[-2] == 'comments':
            post_id = path.split('/')[3]
            
            for post in db.get('posts', []):
                if post['_id'] == post_id:
                    if 'comments' not in post:
                        post['comments'] = []
                    
                    new_comment = {
                        "_id": str(uuid.uuid4()),
                        "userName": post_data.get('userName', 'Demo Client'),
                        "userEmail": post_data.get('userEmail', 'client@nutrition.com'),
                        "content": post_data.get('content', ''),
                        "replies": [],
                        "createdAt": datetime.datetime.now().isoformat()
                    }
                    post['comments'].append(new_comment)
                    write_db(db)
                    self.send_json(201, {"success": True, "data": new_comment, "comments": post['comments']})
                    return
            self.send_json(404, {"success": False, "message": "Post not found"})
            return

        # Add comment reply
        elif '/comments/' in path and path.endswith('/replies'):
            # Path format: /api/posts/<postId>/comments/<commentId>/replies
            parts = path.split('/')
            post_id = parts[3]
            comment_id = parts[5]
            
            for post in db.get('posts', []):
                if post['_id'] == post_id:
                    for comment in post.get('comments', []):
                        if comment['_id'] == comment_id:
                            if 'replies' not in comment:
                                comment['replies'] = []
                            new_reply = {
                                "_id": str(uuid.uuid4()),
                                "userName": post_data.get('userName', 'Demo Client'),
                                "userEmail": post_data.get('userEmail', 'client@nutrition.com'),
                                "content": post_data.get('content', ''),
                                "createdAt": datetime.datetime.now().isoformat()
                            }
                            comment['replies'].append(new_reply)
                            write_db(db)
                            self.send_json(201, {"success": True, "data": new_reply, "comments": post['comments']})
                            return
            self.send_json(404, {"success": False, "message": "Post or Comment not found"})
            return

        # Admin CRUD: Create Post (multipart)
        elif path == '/api/admin/posts':
            fields, files = self.parse_multipart()
            post_type = fields.get('type', 'instagram')
            caption = fields.get('caption', '')
            title = fields.get('title', '')
            category = fields.get('category', 'nutrition-tips')
            featured = fields.get('featured', 'false').lower() == 'true'
            is_published = fields.get('isPublished', 'true').lower() == 'true'
            client_name = fields.get('clientName', '')
            client_details = fields.get('clientDetails', '')

            new_post = {
                "_id": str(uuid.uuid4()),
                "type": post_type,
                "title": title,
                "category": category,
                "featured": featured,
                "isPublished": is_published,
                "caption": caption,
                "createdAt": datetime.datetime.now().isoformat(),
                "viewCount": 0,
                "likes": [],
                "comments": []
            }

            if post_type == 'transformation':
                before_img = files.get('beforeImage')
                after_img = files.get('afterImage')
                if before_img:
                    fname = f"before_{uuid.uuid4()}_{before_img['filename']}"
                    with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                        f.write(before_img['data'])
                    new_post['beforeImageUrl'] = f"/uploads/{fname}"
                if after_img:
                    fname = f"after_{uuid.uuid4()}_{after_img['filename']}"
                    with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                        f.write(after_img['data'])
                    new_post['afterImageUrl'] = f"/uploads/{fname}"
                new_post['clientName'] = client_name
                new_post['clientDetails'] = client_details
            else:
                media_file = files.get('mediaFile')
                if media_file:
                    fname = f"media_{uuid.uuid4()}_{media_file['filename']}"
                    with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                        f.write(media_file['data'])
                    new_post['mediaUrl'] = f"/uploads/{fname}"
                    new_post['mediaType'] = 'video' if media_file['filename'].lower().endswith(('.mp4', '.mov', '.avi', '.webm')) else 'image'

            db['posts'].insert(0, new_post)
            write_db(db)
            self.send_json(201, {"success": True, "data": new_post})
            return

        # Admin CRUD: Create Product (multipart)
        elif path == '/api/admin/products':
            fields, files = self.parse_multipart()
            name = fields.get('name', '')
            price = float(fields.get('price', 0))
            stock = int(fields.get('stock', 0))
            description = fields.get('description', '')
            buy_link = fields.get('buyLink', 'https://www.herbalife.com')
            
            new_prod = {
                "_id": str(uuid.uuid4()),
                "name": name,
                "price": price,
                "stock": stock,
                "description": description,
                "buyLink": buy_link
            }
            
            prod_img = files.get('productImage')
            if prod_img:
                fname = f"prod_{uuid.uuid4()}_{prod_img['filename']}"
                with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                    f.write(prod_img['data'])
                new_prod['imageUrl'] = f"/uploads/{fname}"
            else:
                new_prod['imageUrl'] = "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=500&auto=format&fit=crop"
                
            db['products'].append(new_prod)
            write_db(db)
            self.send_json(201, {"success": True, "data": new_prod})
            return

        # Admin CRUD: Create Success Story (multipart)
        elif path == '/api/admin/success':
            fields, files = self.parse_multipart()
            client_name = fields.get('successClientName', '')
            client_details = fields.get('successClientDetails', '')
            testimonial = fields.get('successTestimonial', '')
            
            new_story = {
                "_id": str(uuid.uuid4()),
                "clientName": client_name,
                "clientDetails": client_details,
                "testimonial": testimonial
            }
            
            before_img = files.get('successBefore')
            after_img = files.get('successAfter')
            
            if before_img:
                fname = f"before_{uuid.uuid4()}_{before_img['filename']}"
                with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                    f.write(before_img['data'])
                new_story['beforeImageUrl'] = f"/uploads/{fname}"
            if after_img:
                fname = f"after_{uuid.uuid4()}_{after_img['filename']}"
                with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                    f.write(after_img['data'])
                new_story['afterImageUrl'] = f"/uploads/{fname}"
                
            db['success'].append(new_story)
            write_db(db)
            self.send_json(201, {"success": True, "data": new_story})
            return

        # Admin CRUD: Create Blog (JSON)
        elif path == '/api/admin/blogs':
            new_blog = {
                "_id": str(uuid.uuid4()),
                "title": post_data.get('title', ''),
                "category": post_data.get('category', ''),
                "summary": post_data.get('summary', ''),
                "content": post_data.get('content', ''),
                "author": post_data.get('author', 'Preethi Ma\'am'),
                "date": datetime.datetime.now().strftime('%Y-%m-%d'),
                "read_time": post_data.get('read_time', '5 min read')
            }
            db['blogs'].append(new_blog)
            write_db(db)
            self.send_json(201, {"success": True, "data": new_blog})
            return

        # Mark contact query as responded
        elif path.startswith('/api/admin/contacts/') and path.endswith('/respond'):
            parts = path.split('/')
            contact_id = parts[4]
            for c in db.get('contacts', []):
                if c['_id'] == contact_id:
                    c['responded'] = True
                    write_db(db)
                    self.send_json(200, {"success": True, "message": "Query marked as responded", "data": c})
                    return
            self.send_json(404, {"success": False, "message": "Contact query not found"})
            return

        # Return 404
        self.send_json(404, {"success": False, "message": "API endpoint not found"})

    def do_PUT(self):
        path = self.path.split('?')[0]
        db = read_db()
        
        # Read JSON body if JSON
        content_type = self.headers.get('Content-Type', '')
        post_data = {}
        if 'application/json' in content_type:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = json.loads(self.rfile.read(content_length).decode('utf-8'))

        # Update Site Config settings (multipart)
        if path == '/api/admin/content':
            fields, files = self.parse_multipart()
            
            # Map configuration fields
            config = db.setdefault('config', {})
            for key in [
                'homeHeroTitle', 'homeHeroSubtitle', 'contactPhone', 'contactEmail',
                'contactAddress', 'operatingHours', 'aboutHeroTitle', 'aboutHeroSubtitle',
                'aboutMainContent', 'aboutMission', 'aboutVision'
            ]:
                if key in fields:
                    config[key] = fields[key]
            
            if 'aboutExperienceYears' in fields:
                config['aboutExperienceYears'] = int(fields['aboutExperienceYears'])
                
            hero_file = files.get('homeHeroImageFile')
            if hero_file:
                fname = f"hero_{uuid.uuid4()}_{hero_file['filename']}"
                with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                    f.write(hero_file['data'])
                config['homeHeroImage'] = f"/uploads/{fname}"
                
            write_db(db)
            self.send_json(200, {"success": True, "data": config})
            return

        # Edit post
        elif path.startswith('/api/admin/posts/'):
            post_id = path.split('/')[-1]
            fields, files = self.parse_multipart()

            for post in db.get('posts', []):
                if post['_id'] == post_id:
                    if 'caption' in fields: post['caption'] = fields['caption']
                    if 'title' in fields: post['title'] = fields['title']
                    if 'category' in fields: post['category'] = fields['category']
                    if 'featured' in fields: post['featured'] = fields['featured'].lower() == 'true'
                    if 'isPublished' in fields: post['isPublished'] = fields['isPublished'].lower() == 'true'
                    if 'clientName' in fields: post['clientName'] = fields['clientName']
                    if 'clientDetails' in fields: post['clientDetails'] = fields['clientDetails']

                    before_img = files.get('beforeImage')
                    after_img = files.get('afterImage')
                    media_file = files.get('mediaFile')

                    if before_img:
                        fname = f"before_{uuid.uuid4()}_{before_img['filename']}"
                        with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                            f.write(before_img['data'])
                        post['beforeImageUrl'] = f"/uploads/{fname}"
                    if after_img:
                        fname = f"after_{uuid.uuid4()}_{after_img['filename']}"
                        with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                            f.write(after_img['data'])
                        post['afterImageUrl'] = f"/uploads/{fname}"
                    if media_file:
                        fname = f"media_{uuid.uuid4()}_{media_file['filename']}"
                        with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                            f.write(media_file['data'])
                        post['mediaUrl'] = f"/uploads/{fname}"
                        post['mediaType'] = 'video' if media_file['filename'].lower().endswith(('.mp4', '.mov', '.avi', '.webm')) else 'image'

                    write_db(db)
                    self.send_json(200, {"success": True, "data": post})
                    return
            self.send_json(404, {"success": False, "message": "Post not found"})
            return

        # Edit product
        elif path.startswith('/api/admin/products/'):
            prod_id = path.split('/')[-1]
            fields, files = self.parse_multipart()
            
            for prod in db.get('products', []):
                if prod['_id'] == prod_id:
                    prod['name'] = fields.get('name', prod.get('name', ''))
                    prod['price'] = float(fields.get('price', prod.get('price', 0)))
                    prod['stock'] = int(fields.get('stock', prod.get('stock', 0)))
                    prod['description'] = fields.get('description', prod.get('description', ''))
                    prod['buyLink'] = fields.get('buyLink', prod.get('buyLink', ''))
                    
                    prod_img = files.get('productImage')
                    if prod_img:
                        fname = f"prod_{uuid.uuid4()}_{prod_img['filename']}"
                        with open(os.path.join(UPLOAD_DIR, fname), 'wb') as f:
                            f.write(prod_img['data'])
                        prod['imageUrl'] = f"/uploads/{fname}"
                    
                    write_db(db)
                    self.send_json(200, {"success": True, "data": prod})
                    return
            self.send_json(404, {"success": False, "message": "Product not found"})
            return

        # Edit blog
        elif path.startswith('/api/admin/blogs/'):
            blog_id = path.split('/')[-1]
            
            for blog in db.get('blogs', []):
                if blog['_id'] == blog_id:
                    blog['title'] = post_data.get('title', blog.get('title', ''))
                    blog['category'] = post_data.get('category', blog.get('category', ''))
                    blog['summary'] = post_data.get('summary', blog.get('summary', ''))
                    blog['content'] = post_data.get('content', blog.get('content', ''))
                    blog['read_time'] = post_data.get('read_time', blog.get('read_time', ''))
                    
                    write_db(db)
                    self.send_json(200, {"success": True, "data": blog})
                    return
            self.send_json(404, {"success": False, "message": "Blog not found"})
            return

        # Return 404
        self.send_json(404, {"success": False, "message": "API endpoint not found"})

    def do_DELETE(self):
        path = self.path.split('?')[0]
        db = read_db()
        
        # Delete Post
        if path.startswith('/api/admin/posts/'):
            post_id = path.split('/')[-1]
            db['posts'] = [p for p in db.get('posts', []) if p['_id'] != post_id]
            write_db(db)
            self.send_json(200, {"success": True, "message": "Post successfully deleted"})
            return
            
        # Delete Product
        elif path.startswith('/api/admin/products/'):
            prod_id = path.split('/')[-1]
            db['products'] = [p for p in db.get('products', []) if p['_id'] != prod_id]
            write_db(db)
            self.send_json(200, {"success": True, "message": "Product successfully deleted"})
            return

        # Delete Success Story
        elif path.startswith('/api/admin/success/'):
            story_id = path.split('/')[-1]
            db['success'] = [s for s in db.get('success', []) if s['_id'] != story_id]
            write_db(db)
            self.send_json(200, {"success": True, "message": "Story successfully deleted"})
            return

        # Delete Blog
        elif path.startswith('/api/admin/blogs/'):
            blog_id = path.split('/')[-1]
            db['blogs'] = [b for b in db.get('blogs', []) if b['_id'] != blog_id]
            write_db(db)
            self.send_json(200, {"success": True, "message": "Blog successfully deleted"})
            return

        # Delete Contact Query
        elif path.startswith('/api/admin/contacts/'):
            contact_id = path.split('/')[-1]
            db['contacts'] = [c for c in db.get('contacts', []) if c['_id'] != contact_id]
            write_db(db)
            self.send_json(200, {"success": True, "message": "Contact query successfully deleted"})
            return

        # Return 404
        self.send_json(404, {"success": False, "message": "API endpoint not found"})

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

if __name__ == '__main__':
    # Initialize DB file on startup
    read_db()
    
    server = ThreadingHTTPServer(('localhost', PORT), CustomHTTPRequestHandler)
    print("\n" + "="*55)
    print("  [Preethi Nutrition Center - DYNAMIC PYTHON SERVER]")
    print("="*55)
    print(f"  Server started successfully on port {PORT}!")
    print("  Open: http://localhost:5000")
    print()
    print("  TEST ADMIN CREDENTIALS:")
    print("  Admin: admin@preethinutrition.com / AdminPass123!")
    print("="*55 + "\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
