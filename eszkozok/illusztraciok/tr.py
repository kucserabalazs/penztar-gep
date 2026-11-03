import cv2,numpy as np,sys,json
S=3
def load(name):
  g=cv2.imread(name+'.png',cv2.IMREAD_GRAYSCALE).astype(np.float32)
  big=cv2.resize(g,None,fx=S,fy=S,interpolation=cv2.INTER_CUBIC)
  big=cv2.GaussianBlur(big,(0,0),1.1)
  return (big<150).astype(np.uint8)*255
def trace(bw,eps=0.9,minarea=6):
  cs,h=cv2.findContours(bw,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
  out=[]
  for c in cs:
    if cv2.contourArea(c)<minarea*S*S and len(c)<12: continue
    a=cv2.approxPolyDP(c,eps,True)[:,0,:]/S
    if len(a)<3: continue
    pts=[f'{x:.1f} {y:.1f}'.replace('.0 ',' ').replace('.0','') if False else f'{round(x,1):g} {round(y,1):g}' for x,y in a]
    out.append('M'+'L'.join(pts)+'Z')
  return ' '.join(out)
def bbox(bw):
  ys,xs=np.nonzero(bw);return xs.min()/S,ys.min()/S,xs.max()/S,ys.max()/S
if __name__=='__main__':
  for n in sys.argv[1:]:
    bw=load(n);d=trace(bw);x0,y0,x1,y1=bbox(bw);p=6
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0-p:g} {y0-p:g} {x1-x0+2*p:g} {y1-y0+2*p:g}"><path fill="currentColor" fill-rule="evenodd" d="{d}"/></svg>'
    open(n+'.svg','w').write(svg);print(n,len(svg)//1024,'KB')
