import requests
import time
import random
import json
import os
import argparse
import sys
import base64
from datetime import datetime
from cryptography.fernet import Fernet

def generate_key():
    """生成加密密钥"""
    return Fernet.generate_key()

def save_key(key, key_file='encryption_key.key'):
    """保存加密密钥到文件"""
    with open(key_file, 'wb') as f:
        f.write(key)

def load_key(key_file='encryption_key.key'):
    """从文件加载加密密钥"""
    if not os.path.exists(key_file):
        key = generate_key()
        save_key(key, key_file)
        return key
    with open(key_file, 'rb') as f:
        return f.read()

def encrypt_data(data, key=None):
    """使用Fernet对数据进行加密"""
    if key is None:
        key = load_key()
    
    # 将数据转换为JSON字符串
    json_data = json.dumps(data, ensure_ascii=False)
    
    # 创建Fernet实例并加密
    fernet = Fernet(key)
    encrypted_data = fernet.encrypt(json_data.encode('utf-8'))
    
    return encrypted_data

def decrypt_data(encrypted_data, key=None):
    """使用Fernet对数据进行解密"""
    if key is None:
        key = load_key()
    
    # 创建Fernet实例并解密
    fernet = Fernet(key)
    decrypted_data = fernet.decrypt(encrypted_data).decode('utf-8')
    
    # 解析JSON
    return json.loads(decrypted_data)

def fetch_data(api_url, params, headers, max_retries=3):
    """获取API数据，支持重试"""
    for attempt in range(max_retries):
        try:
            response = requests.get(api_url, params=params, headers=headers, timeout=15)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"请求失败，状态码: {response.status_code}")
        except Exception as e:
            print(f"请求异常: {e}")
        
        if attempt < max_retries - 1:
            wait_time = random.uniform(2, 5)
            print(f"等待 {wait_time:.2f} 秒后重试...")
            time.sleep(wait_time)
    
    return None

def fetch_ranking_data(ranking_type, language='en', max_pages=10):
    """
    获取指定排名类型的数据
    
    参数:
    - ranking_type: 排名类型，可选值: 'monthly_rank', 'total_rank', 'income_rank', 'region_rank'
    - language: 语言，可选值: 'en', 'zh'
    - max_pages: 最大抓取页数
    
    返回:
    - 处理后的数据列表
    """
    # 设置API参数
    api_config = {
        'monthly_rank': {
            'url': 'https://www.toolify.ai/self-api/v1/top/month-top',
            'order_by': 'growth',
            'per_page': 50
        },
        'total_rank': {
            'url': 'https://www.toolify.ai/self-api/v1/top/category-v1',
            'order_by': 'month_visited_count',
            'per_page': 100
        },
        'income_rank': {
            'url': 'https://www.toolify.ai/self-api/v1/top/high-revenue',
            'order_by': None,  # 这个接口不需要order_by参数
            'per_page': 50
        },
        'region_rank': {
            'url': 'https://www.toolify.ai/self-api/v1/top/region-v1',
            'order_by': 'month_visited_count',
            'per_page': 50
        }
    }
    
    if ranking_type not in api_config:
        raise ValueError(f"不支持的排名类型: {ranking_type}")
    
    config = api_config[ranking_type]
    base_url = config['url']
    per_page = config['per_page']
    order_by = config['order_by']
    
    # 设置请求头，针对不同语言设置不同的请求头
    if language == 'zh':
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'Cookie': 'g_state={"i_p":1752121384435,"i_l":2}; locale=zh; timezone=Asia/Shanghai; toolify_isLogin=false; TOOLIFY_SESSION_ID=AUWb5heFc7V6lTTIrABOgWBSOx8KhjSmSOgDQLc9; toolify_userinfo={}; utm=https://www.toolify.ai/ai-model/'
        }
    else:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cookie': 'g_state={"i_p":1752121384435,"i_l":2}; locale=en; timezone=Asia/Shanghai; toolify_isLogin=false; TOOLIFY_SESSION_ID=AUWb5heFc7V6lTTIrABOgWBSOx8KhjSmSOgDQLc9; toolify_userinfo={}; utm=https://www.toolify.ai/ai-model/'
        }
    
    all_items = []
    
    for page in range(1, max_pages + 1):
        print(f"正在获取 {ranking_type} - {language} 第 {page}/{max_pages} 页数据...")
        
        # 设置请求参数
        params = {
            'page': page,
            'per_page': per_page,
            'direction': 'desc'
        }
        
        if order_by:
            params['order_by'] = order_by
        
        # 获取数据
        json_data = fetch_data(base_url, params, headers)
        if not json_data:
            print(f"获取第 {page} 页数据失败，跳过")
            continue
        
        # 提取数据
        page_data = json_data.get('data', {}).get('data', [])
        if not page_data:
            print(f"第 {page} 页无数据，结束抓取")
            break
        
        print(f"第 {page} 页获取到 {len(page_data)} 条数据")
        
        # 处理数据
        for i, item in enumerate(page_data):
            # 计算排名
            rank = (page - 1) * per_page + i + 1
            
            # 获取网站URL
            website = item.get('website', '')
            if website and '?utm_source=' in website:
                website = website.split('?utm_source=')[0]
            
            # 处理流量数据 - 不同API返回格式不同
            traffic = item.get('traffic', {})
            
            # 创建标准化数据结构
            processed_item = {
                'id': item.get('id', f"{ranking_type}_{rank}"),
                'rank': rank,
                'name': item.get('name', ''),
                'website': website or item.get('url', ''),
                'logo': item.get('website_logo', '') or item.get('image', '') or item.get('logo', ''),
                'description': item.get('description', ''),
                'monthly_visits': item.get('month_visited_count', 0) or item.get('monthly_visits', 0),
                'categories': [cat.get('name') for cat in item.get('categories', [])] if isinstance(item.get('categories', []), list) else [],
                'tags': item.get('tags', []),
            }
            
            # 根据不同排名类型处理特定字段
            if ranking_type == 'monthly_rank':
                # 月度排名API中，保留原始growth和growth_rate数据
                processed_item['growth'] = item.get('growth')
                processed_item['growth_rate'] = item.get('growth_rate')
                processed_item['top_region'] = ''
                processed_item['top_region_value'] = 0
                
                # 直接保存原始数据，用于调试
                processed_item['raw_growth_data'] = {
                    'growth': item.get('growth'),
                    'growth_rate': item.get('growth_rate')
                }
            elif ranking_type == 'region_rank':
                # 地区排名API中，top_region和top_region_value直接在根对象中
                processed_item['growth'] = item.get('growth', traffic.get('growth', 0))
                processed_item['growth_rate'] = item.get('growth_rate', traffic.get('growth_rate', 0))
                processed_item['top_region'] = item.get('top_region', traffic.get('top_region', ''))
                processed_item['top_region_value'] = item.get('top_region_value', traffic.get('top_region_value', 0))
            else:
                # 其他排名API中，这些字段可能在traffic对象中
                processed_item['growth'] = item.get('growth', traffic.get('growth', 0))
                processed_item['growth_rate'] = item.get('growth_rate', traffic.get('growth_rate', 0))
                processed_item['top_region'] = traffic.get('top_region', '')
                processed_item['top_region_value'] = traffic.get('top_region_value', 0)
            
            # 添加是否免费字段
            processed_item['is_free'] = item.get('is_free', False)
            
            # 收入排名特有字段
            if ranking_type == 'income_rank':
                processed_item['estimated_income'] = item.get('estimated_revenue', 0)
                processed_item['payment_platform'] = item.get('payment_platform', '') or '未知'
            
            all_items.append(processed_item)
        
        # 如果不是最后一页，等待一段时间
        if page < max_pages:
            wait_time = random.uniform(1, 3)
            print(f"等待 {wait_time:.2f} 秒后请求下一页...")
            time.sleep(wait_time)
    
    print(f"共获取 {len(all_items)} 条 {ranking_type} 数据")
    return all_items

def save_data(data, ranking_type, language, encrypt=False):
    """保存数据到JSON文件"""
    # 创建目录
    data_dir = os.path.join('AIrank', 'src', 'data', language)
    os.makedirs(data_dir, exist_ok=True)
    
    # 文件路径
    json_filename = os.path.join(data_dir, f'{ranking_type}.json')
    encrypted_filename = os.path.join(data_dir, f'{ranking_type}.enc')
    
    # 当前时间戳
    timestamp = datetime.now().isoformat()
    
    # 添加元数据
    output_data = {
        'metadata': {
            'last_updated': timestamp,
            'ranking_type': ranking_type,
            'language': language,
            'total_items': len(data)
        },
        'data': data
    }
    
    # 保存到文件
    if encrypt:
        try:
            # 加密数据
            encrypted_data = encrypt_data(output_data)
            
            # 保存加密数据
            with open(encrypted_filename, 'wb') as f:
                f.write(encrypted_data)
            print(f"加密数据已保存到 {encrypted_filename}")
            
            # 同时保存一份未加密的JSON数据（用于开发调试）
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
            print(f"未加密数据已保存到 {json_filename} (用于开发调试)")
            
            return encrypted_filename
        except Exception as e:
            print(f"加密失败: {e}")
            print("保存为未加密数据...")
    
    # 如果不加密或加密失败，保存为普通JSON
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"数据已保存到 {json_filename}")
    return json_filename

def fetch_and_save_data(ranking_type='monthly_rank', language='en', max_pages=10, encrypt=False):
    """获取并保存指定排名类型的数据"""
    data = fetch_ranking_data(ranking_type, language, max_pages)
    if data:
        return save_data(data, ranking_type, language, encrypt)
    return None

def update_all_data(max_pages=10, encrypt=False):
    """更新所有类型的排名数据"""
    ranking_types = ['monthly_rank', 'total_rank', 'income_rank', 'region_rank']
    languages = ['en', 'zh']
    
    results = []
    for language in languages:
        for ranking_type in ranking_types:
            print(f"\n===== 正在更新 {ranking_type} - {language} 数据 =====")
            result = fetch_and_save_data(ranking_type, language, max_pages, encrypt)
            results.append((ranking_type, language, result))
            
            # 不同请求之间稍作等待
            if not (ranking_type == 'region_rank' and language == 'zh'):  # 最后一个不需要等待
                wait_time = random.uniform(2, 5)
                print(f"等待 {wait_time:.2f} 秒后继续...")
                time.sleep(wait_time)
    
    print("\n===== 数据更新完成 =====")
    for ranking_type, language, result in results:
        status = "成功" if result else "失败"
        print(f"{ranking_type} - {language}: {status}")

def decrypt_file(encrypted_file, output_file=None):
    """解密文件"""
    try:
        with open(encrypted_file, 'rb') as f:
            encrypted_data = f.read()
        
        decrypted_data = decrypt_data(encrypted_data)
        
        print(f"成功解密 {encrypted_file}")
        
        # 如果指定了输出文件，保存解密后的数据
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(decrypted_data, f, ensure_ascii=False, indent=2)
            print(f"解密后的数据已保存到 {output_file}")
        
        return decrypted_data
    except Exception as e:
        print(f"解密失败: {e}")
        return None

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='抓取Toolify.ai网站数据')
    parser.add_argument('--type', choices=['monthly_rank', 'total_rank', 'income_rank', 'region_rank', 'all'], 
                        default='all', help='排名类型')
    parser.add_argument('--lang', choices=['en', 'zh', 'all'], default='all', help='语言')
    parser.add_argument('--pages', type=int, default=10, help='每种类型抓取的最大页数')
    parser.add_argument('--encrypt', action='store_true', help='是否加密数据')
    parser.add_argument('--decrypt', type=str, help='要解密的文件路径')
    parser.add_argument('--output', type=str, help='解密后数据的输出文件路径')
    parser.add_argument('--generate-key', action='store_true', help='生成新的加密密钥')
    
    args = parser.parse_args()
    
    # 生成新密钥
    if args.generate_key:
        key = generate_key()
        save_key(key)
        print("已生成新的加密密钥")
        sys.exit(0)
    
    # 解密文件
    if args.decrypt:
        output_file = args.output or args.decrypt.replace('.enc', '_decoded.json')
        decoded_data = decrypt_file(args.decrypt, output_file)
        if decoded_data and not args.output:
            print(json.dumps(decoded_data, ensure_ascii=False, indent=2)[:1000] + "...")
        sys.exit(0)
    
    if args.type == 'all' and args.lang == 'all':
        update_all_data(max_pages=args.pages, encrypt=args.encrypt)
    elif args.type == 'all':
        for ranking_type in ['monthly_rank', 'total_rank', 'income_rank', 'region_rank']:
            fetch_and_save_data(ranking_type=ranking_type, language=args.lang, max_pages=args.pages, 
                               encrypt=args.encrypt)
            time.sleep(random.uniform(1, 3))
    elif args.lang == 'all':
        for language in ['en', 'zh']:
            fetch_and_save_data(ranking_type=args.type, language=language, max_pages=args.pages,
                               encrypt=args.encrypt)
            if language == 'en':  # 最后一个不需要等待
                time.sleep(random.uniform(1, 3))
    else:
        fetch_and_save_data(ranking_type=args.type, language=args.lang, max_pages=args.pages,
                           encrypt=args.encrypt)
